// Code generated by qtc from "index.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/index.html.qtpl:1
package views

//line views/index.html.qtpl:1
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/index.html.qtpl:1
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/index.html.qtpl:2
type IndexPage struct {
	*BasePage
}

//line views/index.html.qtpl:7
func (p *IndexPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/index.html.qtpl:7
	qw422016.N().S(`
  <div class="container d-flex">
    <div>
      <h3>Newest Spritesheets</h3>
      <h3>Newest Maps</h3>
    </div>
    <div class="d-flex flex-column">
      <div class="jumbotron jumbotron-fluid">

      </div>
    </div>
  </div>
`)
//line views/index.html.qtpl:19
}

//line views/index.html.qtpl:19
func (p *IndexPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/index.html.qtpl:19
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/index.html.qtpl:19
	p.StreamContent(qw422016)
//line views/index.html.qtpl:19
	qt422016.ReleaseWriter(qw422016)
//line views/index.html.qtpl:19
}

//line views/index.html.qtpl:19
func (p *IndexPage) Content() string {
//line views/index.html.qtpl:19
	qb422016 := qt422016.AcquireByteBuffer()
//line views/index.html.qtpl:19
	p.WriteContent(qb422016)
//line views/index.html.qtpl:19
	qs422016 := string(qb422016.B)
//line views/index.html.qtpl:19
	qt422016.ReleaseByteBuffer(qb422016)
//line views/index.html.qtpl:19
	return qs422016
//line views/index.html.qtpl:19
}
