// Code generated by qtc from "map.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/map.html.qtpl:1
package views

//line views/map.html.qtpl:1
import "github.com/etherealmachine/rpg.ai/server/models"

//line views/map.html.qtpl:3
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/map.html.qtpl:3
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/map.html.qtpl:4
type MapPage struct {
	*BasePage
	User models.User
}

//line views/map.html.qtpl:10
func (p *MapPage) StreamContent(qw422016 *qt422016.Writer) {
//line views/map.html.qtpl:10
	qw422016.N().S(`
  <div style="flex: 1" class="Map"></div>
`)
//line views/map.html.qtpl:12
}

//line views/map.html.qtpl:12
func (p *MapPage) WriteContent(qq422016 qtio422016.Writer) {
//line views/map.html.qtpl:12
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/map.html.qtpl:12
	p.StreamContent(qw422016)
//line views/map.html.qtpl:12
	qt422016.ReleaseWriter(qw422016)
//line views/map.html.qtpl:12
}

//line views/map.html.qtpl:12
func (p *MapPage) Content() string {
//line views/map.html.qtpl:12
	qb422016 := qt422016.AcquireByteBuffer()
//line views/map.html.qtpl:12
	p.WriteContent(qb422016)
//line views/map.html.qtpl:12
	qs422016 := string(qb422016.B)
//line views/map.html.qtpl:12
	qt422016.ReleaseByteBuffer(qb422016)
//line views/map.html.qtpl:12
	return qs422016
//line views/map.html.qtpl:12
}
