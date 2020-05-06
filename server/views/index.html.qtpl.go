// Code generated by qtc from "index.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/index.html.qtpl:1
package views

//line views/index.html.qtpl:1
import "github.com/etherealmachine/rpg.ai/server/models"

//line views/index.html.qtpl:3
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/index.html.qtpl:3
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/index.html.qtpl:4
type IndexPage struct {
	*BasePage
	User models.User
}

//line views/index.html.qtpl:10
func (p *IndexPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/index.html.qtpl:10
	qw422016.N().S(`
  <div class="container">
    <h2>Newest Content</h2>
  </div>
`)
//line views/index.html.qtpl:14
}

//line views/index.html.qtpl:14
func (p *IndexPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/index.html.qtpl:14
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/index.html.qtpl:14
	p.StreamContent(qw422016)
//line views/index.html.qtpl:14
	qt422016.ReleaseWriter(qw422016)
//line views/index.html.qtpl:14
}

//line views/index.html.qtpl:14
func (p *IndexPage) Content() string {
//line views/index.html.qtpl:14
	qb422016 := qt422016.AcquireByteBuffer()
//line views/index.html.qtpl:14
	p.WriteContent(qb422016)
//line views/index.html.qtpl:14
	qs422016 := string(qb422016.B)
//line views/index.html.qtpl:14
	qt422016.ReleaseByteBuffer(qb422016)
//line views/index.html.qtpl:14
	return qs422016
//line views/index.html.qtpl:14
}
