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
	"os/exec"
	"os/signal"
	"strings"
	"sync"
	"syscall"
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
					loadDevAssets()
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

func loadAssetsFromIndex(r io.Reader) error {
	assetLock.Lock()
	defer assetLock.Unlock()
	scripts = nil
	links = nil
	styles = nil
	doc, err := html.Parse(r)
	if err != nil {
		return err
	}
	detectNodes(doc)
	return nil
}

func loadProductionAssets() error {
	f, err := os.Open("build/index.html")
	if err != nil {
		return err
	}
	defer f.Close()
	return loadAssetsFromIndex(f)
}

func loadDevAssets() error {
	resp, err := http.Get("http://localhost:3000")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return loadAssetsFromIndex(resp.Body)
}

func runWebpack() error {
	cmd := exec.Command("yarn", "start")
	yarnBin := fmt.Sprintf("%s/.yarn/bin", os.Getenv("HOME"))
	nodeBin := fmt.Sprintf("%s/.nvm/versions/node/v10.15.3/bin", os.Getenv("HOME"))
	cmd.Env = append(cmd.Env, fmt.Sprintf("PATH=%s;%s;%s", yarnBin, nodeBin, os.Getenv("PATH")))
	cmd.Env = append(cmd.Env, "BROWSER=none")
	cmd.Env = append(cmd.Env, fmt.Sprintf("REACT_APP_GOOGLE_CLIENT_ID=%s", os.Getenv("GOOGLE_CLIENT_ID")))
	cmd.Env = append(cmd.Env, fmt.Sprintf("REACT_APP_FACEBOOK_APP_ID=%s", os.Getenv("FACEBOOK_APP_ID")))
	cmd.Stdout = log.Writer()
	cmd.Stderr = log.Writer()
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		cmd.Process.Kill()
		os.Exit(0)
	}()
	return cmd.Run()
}

func CacheBuster(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Cache-Control") == "no-cache" {
			loadDevAssets()
		}
		h.ServeHTTP(w, r)
	})
}
