// Code generated by qtc from "characters.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line views/characters.html.qtpl:1
package views

//line views/characters.html.qtpl:1
import (
	"github.com/etherealmachine/rpg.ai/server/models"
	"github.com/nleeper/goment"
)

//line views/characters.html.qtpl:6
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line views/characters.html.qtpl:6
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line views/characters.html.qtpl:6
func StreamCharacterDisplay(qw422016 *qt422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:6
	qw422016.N().S(`
  <div class="collapse show character-`)
//line views/characters.html.qtpl:7
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:7
	qw422016.N().S(`">
    `)
//line views/characters.html.qtpl:8
	StreamCharacterCard(qw422016, p, character)
//line views/characters.html.qtpl:8
	qw422016.N().S(`
    <button
        class="btn btn-secondary"
        type="button"
        data-toggle="collapse"
        data-target=".character-`)
//line views/characters.html.qtpl:13
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:13
	qw422016.N().S(`">Edit</button>
  </div>
  <div class="collapse character-`)
//line views/characters.html.qtpl:15
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:15
	qw422016.N().S(`">
    `)
//line views/characters.html.qtpl:16
	StreamCharacterEditor(qw422016, p, character)
//line views/characters.html.qtpl:16
	qw422016.N().S(`
    <button
        class="btn btn-warning"
        type="button"
        data-toggle="collapse"
        data-target=".character-`)
//line views/characters.html.qtpl:21
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:21
	qw422016.N().S(`">Cancel</button>
  </div>
`)
//line views/characters.html.qtpl:23
}

//line views/characters.html.qtpl:23
func WriteCharacterDisplay(qq422016 qtio422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:23
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/characters.html.qtpl:23
	StreamCharacterDisplay(qw422016, p, character)
//line views/characters.html.qtpl:23
	qt422016.ReleaseWriter(qw422016)
//line views/characters.html.qtpl:23
}

//line views/characters.html.qtpl:23
func CharacterDisplay(p *BasePage, character models.Character) string {
//line views/characters.html.qtpl:23
	qb422016 := qt422016.AcquireByteBuffer()
//line views/characters.html.qtpl:23
	WriteCharacterDisplay(qb422016, p, character)
//line views/characters.html.qtpl:23
	qs422016 := string(qb422016.B)
//line views/characters.html.qtpl:23
	qt422016.ReleaseByteBuffer(qb422016)
//line views/characters.html.qtpl:23
	return qs422016
//line views/characters.html.qtpl:23
}

//line views/characters.html.qtpl:25
func StreamCharacterCard(qw422016 *qt422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:25
	qw422016.N().S(`
  <div class="card">
    <div class="card-body">
      <h5 class="card-title d-flex flex-row justify-content-between">
        <span>`)
//line views/characters.html.qtpl:29
	qw422016.E().S(character.Name)
//line views/characters.html.qtpl:29
	qw422016.N().S(`</span>
        `)
//line views/characters.html.qtpl:30
	if g, err := goment.New(character.CreatedAt); err == nil {
//line views/characters.html.qtpl:30
		qw422016.N().S(`
          <span class="text-muted">`)
//line views/characters.html.qtpl:31
		qw422016.E().S(g.FromNow())
//line views/characters.html.qtpl:31
		qw422016.N().S(`</span>
        `)
//line views/characters.html.qtpl:32
	}
//line views/characters.html.qtpl:32
	qw422016.N().S(`
      </h5>
    </div>
  </div>
`)
//line views/characters.html.qtpl:36
}

//line views/characters.html.qtpl:36
func WriteCharacterCard(qq422016 qtio422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:36
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/characters.html.qtpl:36
	StreamCharacterCard(qw422016, p, character)
//line views/characters.html.qtpl:36
	qt422016.ReleaseWriter(qw422016)
//line views/characters.html.qtpl:36
}

//line views/characters.html.qtpl:36
func CharacterCard(p *BasePage, character models.Character) string {
//line views/characters.html.qtpl:36
	qb422016 := qt422016.AcquireByteBuffer()
//line views/characters.html.qtpl:36
	WriteCharacterCard(qb422016, p, character)
//line views/characters.html.qtpl:36
	qs422016 := string(qb422016.B)
//line views/characters.html.qtpl:36
	qt422016.ReleaseByteBuffer(qb422016)
//line views/characters.html.qtpl:36
	return qs422016
//line views/characters.html.qtpl:36
}

//line views/characters.html.qtpl:38
func StreamCharacterEditor(qw422016 *qt422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:38
	qw422016.N().S(`
  <form action="/character/update" method="POST">
    <div class="form-group">
      <label for="name">Name</label>
      <input class="form-control" name="Name" value="`)
//line views/characters.html.qtpl:42
	qw422016.E().S(character.Name)
//line views/characters.html.qtpl:42
	qw422016.N().S(`" />
    </div>
    <input type="hidden" name="ID" value="`)
//line views/characters.html.qtpl:44
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:44
	qw422016.N().S(`" />
    <input type="hidden" name="gorilla.csrf.Token" value="`)
//line views/characters.html.qtpl:45
	qw422016.E().S(p.CsrfToken)
//line views/characters.html.qtpl:45
	qw422016.N().S(`" />
    <button type="submit" class="btn btn-primary">Save</button>
  </form>
  <form action="/character/delete" method="POST">
    <input type="hidden" name="ID" value="`)
//line views/characters.html.qtpl:49
	qw422016.E().V(character.ID)
//line views/characters.html.qtpl:49
	qw422016.N().S(`" />
    <input type="hidden" name="gorilla.csrf.Token" value="`)
//line views/characters.html.qtpl:50
	qw422016.E().S(p.CsrfToken)
//line views/characters.html.qtpl:50
	qw422016.N().S(`" />
    <button type="submit" class="btn btn-danger">Delete</button>
  </form>
`)
//line views/characters.html.qtpl:53
}

//line views/characters.html.qtpl:53
func WriteCharacterEditor(qq422016 qtio422016.Writer, p *BasePage, character models.Character) {
//line views/characters.html.qtpl:53
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/characters.html.qtpl:53
	StreamCharacterEditor(qw422016, p, character)
//line views/characters.html.qtpl:53
	qt422016.ReleaseWriter(qw422016)
//line views/characters.html.qtpl:53
}

//line views/characters.html.qtpl:53
func CharacterEditor(p *BasePage, character models.Character) string {
//line views/characters.html.qtpl:53
	qb422016 := qt422016.AcquireByteBuffer()
//line views/characters.html.qtpl:53
	WriteCharacterEditor(qb422016, p, character)
//line views/characters.html.qtpl:53
	qs422016 := string(qb422016.B)
//line views/characters.html.qtpl:53
	qt422016.ReleaseByteBuffer(qb422016)
//line views/characters.html.qtpl:53
	return qs422016
//line views/characters.html.qtpl:53
}

//line views/characters.html.qtpl:55
func StreamCharacterCreator(qw422016 *qt422016.Writer, p *BasePage) {
//line views/characters.html.qtpl:55
	qw422016.N().S(`
  <form action="/character/create" method="POST">
    <div class="form-group">
      <label for="name">Name</label>
      <input class="form-control" name="Name" placeholder="Name" />
    </div>
    <input type="hidden" name="Definition" value="{}" />
    <input type="hidden" name="gorilla.csrf.Token" value="`)
//line views/characters.html.qtpl:62
	qw422016.E().S(p.CsrfToken)
//line views/characters.html.qtpl:62
	qw422016.N().S(`" />
    <button type="submit" class="btn btn-primary">Create</button>
  </form>
`)
//line views/characters.html.qtpl:65
}

//line views/characters.html.qtpl:65
func WriteCharacterCreator(qq422016 qtio422016.Writer, p *BasePage) {
//line views/characters.html.qtpl:65
	qw422016 := qt422016.AcquireWriter(qq422016)
//line views/characters.html.qtpl:65
	StreamCharacterCreator(qw422016, p)
//line views/characters.html.qtpl:65
	qt422016.ReleaseWriter(qw422016)
//line views/characters.html.qtpl:65
}

//line views/characters.html.qtpl:65
func CharacterCreator(p *BasePage) string {
//line views/characters.html.qtpl:65
	qb422016 := qt422016.AcquireByteBuffer()
//line views/characters.html.qtpl:65
	WriteCharacterCreator(qb422016, p)
//line views/characters.html.qtpl:65
	qs422016 := string(qb422016.B)
//line views/characters.html.qtpl:65
	qt422016.ReleaseByteBuffer(qb422016)
//line views/characters.html.qtpl:65
	return qs422016
//line views/characters.html.qtpl:65
}
