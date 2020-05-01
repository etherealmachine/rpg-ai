package main

import (
	"container/list"
	"log"
	"net/http"
	"sync"

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

type Session struct {
	sync.Mutex
	Code  string
	Peers *list.List
}

func (s *Session) AddPeer(conn *websocket.Conn) {
	s.Lock()
	s.Peers.PushBack(conn)
	s.Unlock()
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
	}
}

func (s *Session) Broadcast(m *interface{}, exceptTo *websocket.Conn) {
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
		msg := new(interface{})
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println(err)
			session.RemovePeer(conn)
			return
		}
		session.Broadcast(msg, conn)
	}
}
