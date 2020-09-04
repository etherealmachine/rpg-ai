package main

import (
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
)

func init() {
	_, err := exec.LookPath("clingo")
	if err != nil {
		log.Fatal("unable to find clingo in PATH")
	}
}

type ClingoService struct {
}

type RunProgramRequest struct {
	Program string
}

type RunProgramResponse struct {
	Stdout     string
	Stderr     string
	ReturnCode int
}

func (s *ClingoService) RunProgram(r *http.Request, arg *RunProgramRequest, reply *RunProgramResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	f, err := ioutil.TempFile("tmp", "clingo-input")
	if err != nil {
		panic(err)
	}
	f.WriteString(arg.Program)
	f.Close()
	defer func() {
		os.Remove(f.Name())
	}()
	seed := rand.Intn(2147483647)
	cmd := exec.Command("clingo", f.Name(), "--rand-freq=1.0", fmt.Sprintf("--seed=%d", seed))
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		reply.ReturnCode = cmd.ProcessState.ExitCode()
	}
	reply.Stdout = stdout.String()
	reply.Stderr = stderr.String()
	return nil
}
