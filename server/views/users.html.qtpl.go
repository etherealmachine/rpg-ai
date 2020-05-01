// Code generated by qtc from "users.html.qtpl". DO NOT EDIT.
// See https://github.com/valyala/quicktemplate for details.

//line server/views/users.html.qtpl:1
package views

//line server/views/users.html.qtpl:1
import "github.com/etherealmachine/rpg.ai/server/models"

//line server/views/users.html.qtpl:2
import (
	qtio422016 "io"

	qt422016 "github.com/valyala/quicktemplate"
)

//line server/views/users.html.qtpl:2
var (
	_ = qtio422016.Copy
	_ = qt422016.AcquireByteBuffer
)

//line server/views/users.html.qtpl:2
func StreamUsers(qw422016 *qt422016.Writer, publicURL string, users []models.User) {
//line server/views/users.html.qtpl:2
	qw422016.N().S(`
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <link rel="icon" href="`)
//line server/views/users.html.qtpl:8
	qw422016.E().S(publicURL)
//line server/views/users.html.qtpl:8
	qw422016.N().S(`/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <link rel="apple-touch-icon" href="`)
//line server/views/users.html.qtpl:11
	qw422016.E().S(publicURL)
//line server/views/users.html.qtpl:11
	qw422016.N().S(`/logo192.png" />
  <title>RPG.ai</title>
  <style>
    html,
    body {
      height: 100%;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
    integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous" />
  <link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet"
    integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous">
</head>

<body>
  <div id="root" style="height: 100%">
    <ol>
      `)
//line server/views/users.html.qtpl:34
	for _, user := range users {
//line server/views/users.html.qtpl:34
		qw422016.N().S(`
      <li>`)
//line server/views/users.html.qtpl:35
		qw422016.E().V(user.ID)
//line server/views/users.html.qtpl:35
		qw422016.N().S(`: `)
//line server/views/users.html.qtpl:35
		qw422016.E().S(user.Email)
//line server/views/users.html.qtpl:35
		qw422016.N().S(`, `)
//line server/views/users.html.qtpl:35
		qw422016.E().V(user.CreatedOn)
//line server/views/users.html.qtpl:35
		qw422016.N().S(`</li>
      `)
//line server/views/users.html.qtpl:36
	}
//line server/views/users.html.qtpl:36
	qw422016.N().S(`
    </ol>
  </div>
</body>

</html>
`)
//line server/views/users.html.qtpl:42
}

//line server/views/users.html.qtpl:42
func WriteUsers(qq422016 qtio422016.Writer, publicURL string, users []models.User) {
//line server/views/users.html.qtpl:42
	qw422016 := qt422016.AcquireWriter(qq422016)
//line server/views/users.html.qtpl:42
	StreamUsers(qw422016, publicURL, users)
//line server/views/users.html.qtpl:42
	qt422016.ReleaseWriter(qw422016)
//line server/views/users.html.qtpl:42
}

//line server/views/users.html.qtpl:42
func Users(publicURL string, users []models.User) string {
//line server/views/users.html.qtpl:42
	qb422016 := qt422016.AcquireByteBuffer()
//line server/views/users.html.qtpl:42
	WriteUsers(qb422016, publicURL, users)
//line server/views/users.html.qtpl:42
	qs422016 := string(qb422016.B)
//line server/views/users.html.qtpl:42
	qt422016.ReleaseByteBuffer(qb422016)
//line server/views/users.html.qtpl:42
	return qs422016
//line server/views/users.html.qtpl:42
}
