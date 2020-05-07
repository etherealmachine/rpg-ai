package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/net/html"
)

var (
	scripts   []*html.Node
	links     []*html.Node
	styles    []*html.Node
	assetLock sync.Mutex
)

type WebpackProxy struct {
	url      *url.URL
	upgrader *websocket.Upgrader
}

func NewWebpackProxy(url *url.URL) *WebpackProxy {
	return &WebpackProxy{
		url: url,
		upgrader: &websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}
}

type websocketMsg struct {
	MsgType int
	Data    []byte
}

func (p *WebpackProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/sockjs-node" {
		local, err := p.upgrader.Upgrade(w, r, nil)
		if err != nil {
			panic(err)
		}
		localChan := make(chan *websocketMsg, 1)
		go func() {
			for {
				t, data, err := local.ReadMessage()
				if err != nil {
					return
				}
				localChan <- &websocketMsg{t, data}
			}
		}()
		remote, _, err := websocket.DefaultDialer.Dial(fmt.Sprintf("ws://%s%s", p.url.Host, r.URL.Path), nil)
		if err != nil {
			panic(err)
		}
		remoteChan := make(chan *websocketMsg, 1)
		go func() {
			for {
				t, data, err := remote.ReadMessage()
				if err != nil {
					return
				}
				msg := make(map[string]interface{})
				err = json.Unmarshal(data, &msg)
				if err != nil {
					log.Println(err)
					return
				}
				if v, ok := msg["type"].(string); ok && v == "invalid" {
					loadAssets()
				}
				remoteChan <- &websocketMsg{t, data}
			}
		}()
		for {
			select {
			case msg := <-localChan:
				if err := remote.WriteMessage(msg.MsgType, msg.Data); err != nil {
					return
				}
			case msg := <-remoteChan:
				if err := local.WriteMessage(msg.MsgType, msg.Data); err != nil {
					return
				}
			}
		}
	}
	resp, err := http.Get(fmt.Sprintf("%s://%s%s", p.url.Scheme, p.url.Host, r.URL.Path))
	if err != nil {
		panic(err)
	}
	c := strings.Split(r.URL.Path, "/")
	buf, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	http.ServeContent(w, r, c[len(c)-1], time.Now(), bytes.NewReader(buf))
}

func detectNodes(n *html.Node) {
	if n.Type == html.ElementNode && n.Data == "script" {
		scripts = append(scripts, n)
	} else if n.Type == html.ElementNode && n.Data == "link" {
		links = append(links, n)
	} else if n.Type == html.ElementNode && n.Data == "style" {
		styles = append(styles, n)
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		detectNodes(c)
	}
}

func loadAssets() error {
	assetLock.Lock()
	defer assetLock.Unlock()
	scripts = nil
	links = nil
	styles = nil
	var r io.Reader
	if Dev {
		resp, err := http.Get("http://localhost:3000")
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		r = resp.Body
	} else {
		f, err := os.Open("build/index.html")
		if err != nil {
			return err
		}
		defer f.Close()
		r = f
	}
	doc, err := html.Parse(r)
	if err != nil {
		return err
	}
	detectNodes(doc)
	return nil
}
