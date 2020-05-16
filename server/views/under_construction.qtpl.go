// Code generated by qtc from "under_construction.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/under_construction.qtpl:1
package views

//line views/under_construction.qtpl:1
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/under_construction.qtpl:1
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/under_construction.qtpl:2
type UnderConstructionPage struct {
	*SidebarPage
}

//line views/under_construction.qtpl:7
func (p *UnderConstructionPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/under_construction.qtpl:7
	qw422016.N().S(`
  <div class="container-fluid d-flex mt-4">
    `)
//line views/under_construction.qtpl:9
	p.StreamSidebar(qw422016)
//line views/under_construction.qtpl:9
	qw422016.N().S(`
    <div>
      <h1>Under Construction</h1>
      <p>Yes, I "surfed the web" in the early 90's. Why do you ask?</p>
      <img src="/images/under_construction.gif" />
    </div>
  </div>
`)
//line views/under_construction.qtpl:16
}

//line views/under_construction.qtpl:16
func (p *UnderConstructionPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/under_construction.qtpl:16
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/under_construction.qtpl:16
	p.StreamContent(qw422016)
//line views/under_construction.qtpl:16
	qt422016.ReleaseWriter(qw422016)
//line views/under_construction.qtpl:16
}

//line views/under_construction.qtpl:16
func (p *UnderConstructionPage) Content() string {
//line views/under_construction.qtpl:16
	qb422016 := qt422016.AcquireByteBuffer()
//line views/under_construction.qtpl:16
	p.WriteContent(qb422016)
//line views/under_construction.qtpl:16
	qs422016 := string(qb422016.B)
//line views/under_construction.qtpl:16
	qt422016.ReleaseByteBuffer(qb422016)
//line views/under_construction.qtpl:16
	return qs422016
//line views/under_construction.qtpl:16
}
