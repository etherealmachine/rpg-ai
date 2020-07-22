// Code generated by qtc from "devlog.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/devlog.html.qtpl:1
package views

//line views/devlog.html.qtpl:1
import (
	"fmt"
	"time"

	"github.com/gosimple/slug"
)

//line views/devlog.html.qtpl:9
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/devlog.html.qtpl:9
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/devlog.html.qtpl:10
type Post struct {
	Title     string
	Content   []byte
	CreatedAt time.Time
}

func (p *Post) Path() string {
	return fmt.Sprintf("/devlog/%s", slug.Make(p.Title))
}

type DevlogPage struct {
	*SidebarPage
	Post *Post
	Next *Post
	Prev *Post
}

type DevlogIndexPage struct {
	*SidebarPage
}

//line views/devlog.html.qtpl:32
func (p *DevlogPage) StreamHeader(qw422016 *qt422016.Writer) {
//line views/devlog.html.qtpl:32
	qw422016.N().S(`
  `)
//line views/devlog.html.qtpl:33
	p.SidebarPage.StreamHeader(qw422016)
//line views/devlog.html.qtpl:33
	qw422016.N().S(`
  <style>
    .devlog-content blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: .25em solid #dfe2e5;
    }
  </style>
`)
//line views/devlog.html.qtpl:41
}

//line views/devlog.html.qtpl:41
func (p *DevlogPage) WriteHeader(qq422016 qtio422016.Writer) {
//line views/devlog.html.qtpl:41
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/devlog.html.qtpl:41
	p.StreamHeader(qw422016)
//line views/devlog.html.qtpl:41
	qt422016.ReleaseWriter(qw422016)
//line views/devlog.html.qtpl:41
}

//line views/devlog.html.qtpl:41
func (p *DevlogPage) Header() string {
//line views/devlog.html.qtpl:41
	qb422016 := qt422016.AcquireByteBuffer()
//line views/devlog.html.qtpl:41
	p.WriteHeader(qb422016)
//line views/devlog.html.qtpl:41
	qs422016 := string(qb422016.B)
//line views/devlog.html.qtpl:41
	qt422016.ReleaseByteBuffer(qb422016)
//line views/devlog.html.qtpl:41
	return qs422016
//line views/devlog.html.qtpl:41
}

//line views/devlog.html.qtpl:43
func (p *DevlogPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/devlog.html.qtpl:43
	qw422016.N().S(`
  <div class="container-fluid d-flex position-relative">
    `)
//line views/devlog.html.qtpl:45
	p.StreamSidebar(qw422016)
//line views/devlog.html.qtpl:45
	qw422016.N().S(`
    <div class="container-fluid pt-2">
      Posted `)
//line views/devlog.html.qtpl:47
	qw422016.E().S(Goment(p.Post.CreatedAt).FromNow())
//line views/devlog.html.qtpl:47
	qw422016.N().S(`
      <div class="devlog-content">
        `)
//line views/devlog.html.qtpl:49
	qw422016.N().Z(p.Post.Content)
//line views/devlog.html.qtpl:49
	qw422016.N().S(`
      </div>
      <nav aria-label="Development log navigation">
        <ul class="pagination d-flex">
          `)
//line views/devlog.html.qtpl:53
	if p.Prev != nil {
//line views/devlog.html.qtpl:53
		qw422016.N().S(`
            <li class="page-item" style="margin-right: auto">
              <a class="page-link" href="`)
//line views/devlog.html.qtpl:55
		qw422016.E().S(p.Prev.Path())
//line views/devlog.html.qtpl:55
		qw422016.N().S(`">
                <i class="fa fa-arrow-left"></i>
                &nbsp;
                `)
//line views/devlog.html.qtpl:58
		qw422016.E().S(p.Prev.Title)
//line views/devlog.html.qtpl:58
		qw422016.N().S(`
              </a>
            </li>
          `)
//line views/devlog.html.qtpl:61
	}
//line views/devlog.html.qtpl:61
	qw422016.N().S(`
          `)
//line views/devlog.html.qtpl:62
	if p.Next != nil {
//line views/devlog.html.qtpl:62
		qw422016.N().S(`
            <li class="page-item" style="margin-left: auto">
              <a class="page-link" href="`)
//line views/devlog.html.qtpl:64
		qw422016.E().S(p.Next.Path())
//line views/devlog.html.qtpl:64
		qw422016.N().S(`">
                `)
//line views/devlog.html.qtpl:65
		qw422016.E().S(p.Next.Title)
//line views/devlog.html.qtpl:65
		qw422016.N().S(`
                &nbsp;
                <i class="fa fa-arrow-right"></i>
              </a>
            </li>
          `)
//line views/devlog.html.qtpl:70
	}
//line views/devlog.html.qtpl:70
	qw422016.N().S(`
        </ul>
      </nav>
    </div>
  </div>
`)
//line views/devlog.html.qtpl:75
}

//line views/devlog.html.qtpl:75
func (p *DevlogPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/devlog.html.qtpl:75
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/devlog.html.qtpl:75
	p.StreamContent(qw422016)
//line views/devlog.html.qtpl:75
	qt422016.ReleaseWriter(qw422016)
//line views/devlog.html.qtpl:75
}

//line views/devlog.html.qtpl:75
func (p *DevlogPage) Content() string {
//line views/devlog.html.qtpl:75
	qb422016 := qt422016.AcquireByteBuffer()
//line views/devlog.html.qtpl:75
	p.WriteContent(qb422016)
//line views/devlog.html.qtpl:75
	qs422016 := string(qb422016.B)
//line views/devlog.html.qtpl:75
	qt422016.ReleaseByteBuffer(qb422016)
//line views/devlog.html.qtpl:75
	return qs422016
//line views/devlog.html.qtpl:75
}

//line views/devlog.html.qtpl:77
func (p *DevlogIndexPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/devlog.html.qtpl:77
	qw422016.N().S(`
  <div class="container-fluid d-flex position-relative">
    `)
//line views/devlog.html.qtpl:79
	p.StreamSidebar(qw422016)
//line views/devlog.html.qtpl:79
	qw422016.N().S(`
    <div class="container-fluid pt-2">
      <h1>Development Log</h1>
      <p>
        Like it says on the tin, a chronological log of my thoughts and designs while developing
        this site.
      </p>
      <hr style="width: 100%" />
      `)
//line views/devlog.html.qtpl:87
	for _, post := range p.Posts {
//line views/devlog.html.qtpl:87
		qw422016.N().S(`
        <h4>
          <a href="`)
//line views/devlog.html.qtpl:89
		qw422016.E().S(post.Path())
//line views/devlog.html.qtpl:89
		qw422016.N().S(`">`)
//line views/devlog.html.qtpl:89
		qw422016.E().S(post.Title)
//line views/devlog.html.qtpl:89
		qw422016.N().S(`</a>
          <span class="text-muted" style="font-size: 1rem">- Posted `)
//line views/devlog.html.qtpl:90
		qw422016.E().S(Goment(post.CreatedAt).FromNow())
//line views/devlog.html.qtpl:90
		qw422016.N().S(`</span>
        </h4>
      `)
//line views/devlog.html.qtpl:92
	}
//line views/devlog.html.qtpl:92
	qw422016.N().S(`
    </div>
  </div>
`)
//line views/devlog.html.qtpl:95
}

//line views/devlog.html.qtpl:95
func (p *DevlogIndexPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/devlog.html.qtpl:95
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/devlog.html.qtpl:95
	p.StreamContent(qw422016)
//line views/devlog.html.qtpl:95
	qt422016.ReleaseWriter(qw422016)
//line views/devlog.html.qtpl:95
}

//line views/devlog.html.qtpl:95
func (p *DevlogIndexPage) Content() string {
//line views/devlog.html.qtpl:95
	qb422016 := qt422016.AcquireByteBuffer()
//line views/devlog.html.qtpl:95
	p.WriteContent(qb422016)
//line views/devlog.html.qtpl:95
	qs422016 := string(qb422016.B)
//line views/devlog.html.qtpl:95
	qt422016.ReleaseByteBuffer(qb422016)
//line views/devlog.html.qtpl:95
	return qs422016
//line views/devlog.html.qtpl:95
}