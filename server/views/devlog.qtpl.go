// Code generated by qtc from "devlog.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/devlog.qtpl:1
package views

//line views/devlog.qtpl:1
import "time"

//line views/devlog.qtpl:2
import "github.com/nleeper/goment"

//line views/devlog.qtpl:4
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/devlog.qtpl:4
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/devlog.qtpl:5
type Post struct {
	Content   []byte
	CreatedAt time.Time
}

type DevlogPage struct {
	*BasePage
	Posts []*Post
}

//line views/devlog.qtpl:16
func (p *DevlogPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/devlog.qtpl:16
	qw422016.N().S(`
  <div class="container d-flex mt-4 flex-column">
    `)
//line views/devlog.qtpl:18
	for _, post := range p.Posts {
//line views/devlog.qtpl:18
		qw422016.N().S(`
      <div class="card my-4">
        <div class="card-body">
          `)
//line views/devlog.qtpl:21
		if g, err := goment.New(post.CreatedAt); err == nil {
//line views/devlog.qtpl:21
			qw422016.N().S(`
            `)
//line views/devlog.qtpl:22
			qw422016.E().S(g.FromNow())
//line views/devlog.qtpl:22
			qw422016.N().S(`
          `)
//line views/devlog.qtpl:23
		}
//line views/devlog.qtpl:23
		qw422016.N().S(`
          <div class="devlog-content">
            `)
//line views/devlog.qtpl:25
		qw422016.N().Z(post.Content)
//line views/devlog.qtpl:25
		qw422016.N().S(`
          </div>
        </div>
      </div>
    `)
//line views/devlog.qtpl:29
	}
//line views/devlog.qtpl:29
	qw422016.N().S(`
  </div>
`)
//line views/devlog.qtpl:31
}

//line views/devlog.qtpl:31
func (p *DevlogPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/devlog.qtpl:31
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/devlog.qtpl:31
	p.StreamContent(qw422016)
//line views/devlog.qtpl:31
	qt422016.ReleaseWriter(qw422016)
//line views/devlog.qtpl:31
}

//line views/devlog.qtpl:31
func (p *DevlogPage) Content() string {
//line views/devlog.qtpl:31
	qb422016 := qt422016.AcquireByteBuffer()
//line views/devlog.qtpl:31
	p.WriteContent(qb422016)
//line views/devlog.qtpl:31
	qs422016 := string(qb422016.B)
//line views/devlog.qtpl:31
	qt422016.ReleaseByteBuffer(qb422016)
//line views/devlog.qtpl:31
	return qs422016
//line views/devlog.qtpl:31
}
