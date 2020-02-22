package main

import (
	"container/list"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var WebsocketUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type RTCMsg struct {
	Peers      int             `json:"peers"`
	Offer      *RTCOffer       `json:"offer,omitempty"`
	Candidates []*RTCCandidate `json:"candidates,omitempty"`
}

type RTCOffer struct {
	Type string `json:"type"`
	SDP  string `json:"sdp"`
}

type RTCCandidate struct {
	Candidate     string `json:"candidate"`
	SDPMid        string `json:"sdpMid"`
	SDPMLineIndex int    `json:"sdpMLineIndex"`
}

type Session struct {
	sync.Mutex
	Code  string
	Peers *list.List
}

func (s *Session) AddPeer(conn *websocket.Conn) {
	s.Lock()
	s.Peers.PushBack(conn)
	s.Unlock()
	msg := &RTCMsg{Peers: s.Peers.Len()}
	s.Broadcast(msg, conn)
	if err := conn.WriteJSON(msg); err != nil {
		log.Println(err)
		s.RemovePeer(conn)
	}
}

func (s *Session) RemovePeer(conn *websocket.Conn) {
	var element *list.Element
	for e := s.Peers.Front(); e != nil; e = e.Next() {
		if e.Value == conn {
			element = e
		}
	}
	s.Peers.Remove(element)
	if s.Peers.Len() == 0 {
		log.Printf("closing session %q", s.Code)
		sessions[s.Code] = nil
	} else {
		msg := &RTCMsg{Peers: s.Peers.Len()}
		s.Broadcast(msg, nil)
	}
}

func (s *Session) Broadcast(m *RTCMsg, exceptTo *websocket.Conn) {
	s.Lock()
	var failed []*websocket.Conn
	for e := s.Peers.Front(); e != nil; e = e.Next() {
		if e.Value != exceptTo {
			if err := e.Value.(*websocket.Conn).WriteJSON(m); err != nil {
				failed = append(failed, e.Value.(*websocket.Conn))
			}
		}
	}
	for _, c := range failed {
		s.RemovePeer(c)
	}
	s.Unlock()
}

var sessions map[string]*Session = make(map[string]*Session)

func sessionHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	conn, err := WebsocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	sessionCode := vars["code"]
	session := sessions[sessionCode]
	if session == nil {
		log.Printf("creating new session for %q", sessionCode)
		session = &Session{
			Code:  sessionCode,
			Peers: list.New(),
		}
		sessions[sessionCode] = session
	}
	log.Printf("adding peer to %q", sessionCode)
	session.AddPeer(conn)
	for {
		msg := new(RTCMsg)
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println(err)
			session.RemovePeer(conn)
			return
		}
		session.Broadcast(msg, conn)
	}
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("ok"))
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	r := mux.NewRouter().StrictSlash(true)
	r.HandleFunc("/session/{code}", sessionHandler)
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))
	http.Handle("/", r)

	srv := &http.Server{
		Handler:      r,
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
