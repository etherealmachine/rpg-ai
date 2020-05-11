// Code generated by qtc from "base.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/base.html.qtpl:1
package views

//line views/base.html.qtpl:1
import "golang.org/x/net/html"

//line views/base.html.qtpl:2
import "github.com/etherealmachine/rpg.ai/server/models"

//line views/base.html.qtpl:5
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/base.html.qtpl:5
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/base.html.qtpl:5
type Page interface {
//line views/base.html.qtpl:5
	Header() string
//line views/base.html.qtpl:5
	StreamHeader(qw422016 *qt422016.Writer)
//line views/base.html.qtpl:5
	WriteHeader(qq422016 qtio422016.Writer)
//line views/base.html.qtpl:5
	Navbar() string
//line views/base.html.qtpl:5
	StreamNavbar(qw422016 *qt422016.Writer)
//line views/base.html.qtpl:5
	WriteNavbar(qq422016 qtio422016.Writer)
//line views/base.html.qtpl:5
	Content() string
//line views/base.html.qtpl:5
	StreamContent(qw422016 *qt422016.Writer)
//line views/base.html.qtpl:5
	WriteContent(qq422016 qtio422016.Writer)
//line views/base.html.qtpl:5
	BodyScripts() string
//line views/base.html.qtpl:5
	StreamBodyScripts(qw422016 *qt422016.Writer)
//line views/base.html.qtpl:5
	WriteBodyScripts(qq422016 qtio422016.Writer)
//line views/base.html.qtpl:5
	Footer() string
//line views/base.html.qtpl:5
	StreamFooter(qw422016 *qt422016.Writer)
//line views/base.html.qtpl:5
	WriteFooter(qq422016 qtio422016.Writer)
//line views/base.html.qtpl:5
}

//line views/base.html.qtpl:15
type BasePage struct {
	PublicURL string
	Scripts   []*html.Node
	Links     []*html.Node
	Styles    []*html.Node
	User      *models.User
}

//line views/base.html.qtpl:24
func (p *BasePage) StreamHeader(qw422016 *qt422016.Writer) {
//line views/base.html.qtpl:24
	qw422016.N().S(`
  <meta charset="utf-8" />
  <link rel="icon" href="`)
//line views/base.html.qtpl:26
	qw422016.E().S(p.PublicURL)
//line views/base.html.qtpl:26
	qw422016.N().S(`/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <link rel="apple-touch-icon" href="`)
//line views/base.html.qtpl:29
	qw422016.E().S(p.PublicURL)
//line views/base.html.qtpl:29
	qw422016.N().S(`/logo192.png" />
  <title>RPG.ai</title>
  `)
//line views/base.html.qtpl:31
	for _, node := range p.Styles {
//line views/base.html.qtpl:31
		qw422016.N().S(`
    <style>`)
//line views/base.html.qtpl:32
		if node.FirstChild != nil {
//line views/base.html.qtpl:32
			qw422016.N().S(node.FirstChild.Data)
//line views/base.html.qtpl:32
		}
//line views/base.html.qtpl:32
		qw422016.N().S(`</style>
  `)
//line views/base.html.qtpl:33
	}
//line views/base.html.qtpl:33
	qw422016.N().S(`
  `)
//line views/base.html.qtpl:34
	for _, node := range p.Links {
//line views/base.html.qtpl:34
		qw422016.N().S(`
    <link `)
//line views/base.html.qtpl:35
		for _, attr := range node.Attr {
//line views/base.html.qtpl:35
			qw422016.E().S(attr.Key)
//line views/base.html.qtpl:35
			qw422016.N().S(`=`)
//line views/base.html.qtpl:35
			qw422016.E().S(attr.Val)
//line views/base.html.qtpl:35
			qw422016.N().S(` `)
//line views/base.html.qtpl:35
		}
//line views/base.html.qtpl:35
		qw422016.N().S(` />
  `)
//line views/base.html.qtpl:36
	}
//line views/base.html.qtpl:36
	qw422016.N().S(`
`)
//line views/base.html.qtpl:37
}

//line views/base.html.qtpl:37
func (p *BasePage) WriteHeader(qq422016 qtio422016.Writer) {
//line views/base.html.qtpl:37
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/base.html.qtpl:37
	p.StreamHeader(qw422016)
//line views/base.html.qtpl:37
	qt422016.ReleaseWriter(qw422016)
//line views/base.html.qtpl:37
}

//line views/base.html.qtpl:37
func (p *BasePage) Header() string {
//line views/base.html.qtpl:37
	qb422016 := qt422016.AcquireByteBuffer()
//line views/base.html.qtpl:37
	p.WriteHeader(qb422016)
//line views/base.html.qtpl:37
	qs422016 := string(qb422016.B)
//line views/base.html.qtpl:37
	qt422016.ReleaseByteBuffer(qb422016)
//line views/base.html.qtpl:37
	return qs422016
//line views/base.html.qtpl:37
}

//line views/base.html.qtpl:39
func (p *BasePage) StreamBodyScripts(qw422016 *qt422016.Writer) {
//line views/base.html.qtpl:39
	qw422016.N().S(`
  <script>
    `)
//line views/base.html.qtpl:41
	if p.User != nil {
//line views/base.html.qtpl:41
		qw422016.N().S(`
      window.currentUserID = `)
//line views/base.html.qtpl:42
		qw422016.N().D(int(p.User.ID))
//line views/base.html.qtpl:42
		qw422016.N().S(`;
    `)
//line views/base.html.qtpl:43
	} else {
//line views/base.html.qtpl:43
		qw422016.N().S(`
      window.currentUserID = undefined;
    `)
//line views/base.html.qtpl:45
	}
//line views/base.html.qtpl:45
	qw422016.N().S(`
  </script>
  `)
//line views/base.html.qtpl:47
	for _, node := range p.Scripts {
//line views/base.html.qtpl:47
		qw422016.N().S(`
    <script`)
//line views/base.html.qtpl:48
		for _, attr := range node.Attr {
//line views/base.html.qtpl:48
			qw422016.N().S(` `)
//line views/base.html.qtpl:48
			qw422016.E().S(attr.Key)
//line views/base.html.qtpl:48
			qw422016.N().S(`=`)
//line views/base.html.qtpl:48
			qw422016.E().S(attr.Val)
//line views/base.html.qtpl:48
			qw422016.N().S(` `)
//line views/base.html.qtpl:48
		}
//line views/base.html.qtpl:48
		qw422016.N().S(`>
      `)
//line views/base.html.qtpl:49
		if node.FirstChild != nil {
//line views/base.html.qtpl:49
			qw422016.N().S(node.FirstChild.Data)
//line views/base.html.qtpl:49
		}
//line views/base.html.qtpl:49
		qw422016.N().S(`
    </script>
  `)
//line views/base.html.qtpl:51
	}
//line views/base.html.qtpl:51
	qw422016.N().S(`
`)
//line views/base.html.qtpl:52
}

//line views/base.html.qtpl:52
func (p *BasePage) WriteBodyScripts(qq422016 qtio422016.Writer) {
//line views/base.html.qtpl:52
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/base.html.qtpl:52
	p.StreamBodyScripts(qw422016)
//line views/base.html.qtpl:52
	qt422016.ReleaseWriter(qw422016)
//line views/base.html.qtpl:52
}

//line views/base.html.qtpl:52
func (p *BasePage) BodyScripts() string {
//line views/base.html.qtpl:52
	qb422016 := qt422016.AcquireByteBuffer()
//line views/base.html.qtpl:52
	p.WriteBodyScripts(qb422016)
//line views/base.html.qtpl:52
	qs422016 := string(qb422016.B)
//line views/base.html.qtpl:52
	qt422016.ReleaseByteBuffer(qb422016)
//line views/base.html.qtpl:52
	return qs422016
//line views/base.html.qtpl:52
}

//line views/base.html.qtpl:54
func (p *BasePage) StreamNavbar(qw422016 *qt422016.Writer) {
//line views/base.html.qtpl:54
	qw422016.N().S(`
  <div class="container">
    <nav class="navbar navbar-expand-lg navbar-light justify-content-between">
      <a class="navbar-brand" href="/">RPG.ai</a>
      <form class="form-inline flex-grow-1" action="/search" method="GET">
        <div class="input-group flex-grow-1">
          <input class="form-control" style="max-width: 400px" type="search" name="q" placeholder="Search tilesets and tilemaps" aria-label="Search">
          <div class="input-group-append">
            <button class="btn btn-secondary" type="submit">
              <i class="fa fa-search"></i>
            </button>
          </div>
        </div>
      </form>
      <div class="d-flex align-items-center align-self-end">
        `)
//line views/base.html.qtpl:69
	if p.User != nil {
//line views/base.html.qtpl:69
		qw422016.N().S(`
          <div class="nav-item dropdown">
            <button class="btn btn-link dropdown-toggle" id="navbarDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Settings
          </button>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
              <a href="/profile" class="dropdown-item">`)
//line views/base.html.qtpl:75
		qw422016.E().S(p.User.Email)
//line views/base.html.qtpl:75
		qw422016.N().S(`</a>
              <a class="dropdown-item" href="/logout">Logout</a>
            </div>
          </div>
        `)
//line views/base.html.qtpl:79
	} else {
//line views/base.html.qtpl:79
		qw422016.N().S(`
          <div class="d-flex">
            <div class="GoogleLoginButton"></div>
            <div class="FacebookLoginButton"></div>
          </div>
        `)
//line views/base.html.qtpl:84
	}
//line views/base.html.qtpl:84
	qw422016.N().S(`
      </div>
    </nav>
  </div>
`)
//line views/base.html.qtpl:88
}

//line views/base.html.qtpl:88
func (p *BasePage) WriteNavbar(qq422016 qtio422016.Writer) {
//line views/base.html.qtpl:88
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/base.html.qtpl:88
	p.StreamNavbar(qw422016)
//line views/base.html.qtpl:88
	qt422016.ReleaseWriter(qw422016)
//line views/base.html.qtpl:88
}

//line views/base.html.qtpl:88
func (p *BasePage) Navbar() string {
//line views/base.html.qtpl:88
	qb422016 := qt422016.AcquireByteBuffer()
//line views/base.html.qtpl:88
	p.WriteNavbar(qb422016)
//line views/base.html.qtpl:88
	qs422016 := string(qb422016.B)
//line views/base.html.qtpl:88
	qt422016.ReleaseByteBuffer(qb422016)
//line views/base.html.qtpl:88
	return qs422016
//line views/base.html.qtpl:88
}

//line views/base.html.qtpl:90
func (p *BasePage) StreamFooter(qw422016 *qt422016.Writer) {
//line views/base.html.qtpl:90
	qw422016.N().S(`
  <footer class="mt-auto py-2 bg-light">
    <div class="container">
      <nav class="navbar navbar-expand-lg navbar-light d-flex justify-content-between">
        <a class="nav-item" href="/about">About</a>
        <a class="nav-item" href="mailto:james.l.pettit@gmail.com">Contact</a>
        <small class="nav-item">&copy; Copyright 2020, James Pettit</small>
      </nav>
    </div>
  </footer>
`)
//line views/base.html.qtpl:100
}

//line views/base.html.qtpl:100
func (p *BasePage) WriteFooter(qq422016 qtio422016.Writer) {
//line views/base.html.qtpl:100
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/base.html.qtpl:100
	p.StreamFooter(qw422016)
//line views/base.html.qtpl:100
	qt422016.ReleaseWriter(qw422016)
//line views/base.html.qtpl:100
}

//line views/base.html.qtpl:100
func (p *BasePage) Footer() string {
//line views/base.html.qtpl:100
	qb422016 := qt422016.AcquireByteBuffer()
//line views/base.html.qtpl:100
	p.WriteFooter(qb422016)
//line views/base.html.qtpl:100
	qs422016 := string(qb422016.B)
//line views/base.html.qtpl:100
	qt422016.ReleaseByteBuffer(qb422016)
//line views/base.html.qtpl:100
	return qs422016
//line views/base.html.qtpl:100
}

//line views/base.html.qtpl:102
func StreamPageTemplate(qw422016 *qt422016.Writer, p Page) {
//line views/base.html.qtpl:102
	qw422016.N().S(`
<!DOCTYPE html>
<html lang="en">

<head>
  `)
//line views/base.html.qtpl:107
	p.StreamHeader(qw422016)
//line views/base.html.qtpl:107
	qw422016.N().S(`
</head>

<body>
  `)
//line views/base.html.qtpl:111
	p.StreamNavbar(qw422016)
//line views/base.html.qtpl:111
	qw422016.N().S(`
  `)
//line views/base.html.qtpl:112
	p.StreamContent(qw422016)
//line views/base.html.qtpl:112
	qw422016.N().S(`

  `)
//line views/base.html.qtpl:114
	p.StreamBodyScripts(qw422016)
//line views/base.html.qtpl:114
	qw422016.N().S(`

  `)
//line views/base.html.qtpl:116
	p.StreamFooter(qw422016)
//line views/base.html.qtpl:116
	qw422016.N().S(`
</body>

</html>
`)
//line views/base.html.qtpl:120
}

//line views/base.html.qtpl:120
func WritePageTemplate(qq422016 qtio422016.Writer, p Page) {
//line views/base.html.qtpl:120
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/base.html.qtpl:120
	StreamPageTemplate(qw422016, p)
//line views/base.html.qtpl:120
	qt422016.ReleaseWriter(qw422016)
//line views/base.html.qtpl:120
}

//line views/base.html.qtpl:120
func PageTemplate(p Page) string {
//line views/base.html.qtpl:120
	qb422016 := qt422016.AcquireByteBuffer()
//line views/base.html.qtpl:120
	WritePageTemplate(qb422016, p)
//line views/base.html.qtpl:120
	qs422016 := string(qb422016.B)
//line views/base.html.qtpl:120
	qt422016.ReleaseByteBuffer(qb422016)
//line views/base.html.qtpl:120
	return qs422016
//line views/base.html.qtpl:120
}
