package main

import (
	"fmt"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

func CRUD(r *mux.Router, service interface{}) {
	serviceType := reflect.TypeOf(service)
	for i := 0; i < serviceType.NumMethod(); i++ {
		method := serviceType.Method(i)
		if strings.HasPrefix(method.Name, "Create") {
			r.HandleFunc("/create", crudMethod(service, serviceType, method))
		} else if strings.HasPrefix(method.Name, "Update") {
			r.HandleFunc("/update", crudMethod(service, serviceType, method))
		} else if strings.HasPrefix(method.Name, "Delete") {
			r.HandleFunc("/delete", crudMethod(service, serviceType, method))
		}
	}
}

func crudMethod(service interface{}, serviceType reflect.Type, method reflect.Method) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		args := reflect.New(method.Type.In(2).Elem())
		if err := r.ParseForm(); err != nil {
			redirect := r.FormValue("redirect") + "?error=" + url.PathEscape(err.Error())
			http.Redirect(w, r, redirect, http.StatusFound)
			return
		}
		for name, values := range r.Form {
			field := args.Elem().FieldByNameFunc(func(fieldName string) bool {
				return strings.ToLower(fieldName) == name
			})
			if field.IsValid() {
				switch field.Kind() {
				case reflect.Int32:
					i, err := strconv.ParseInt(values[0], 10, 32)
					if err != nil {
						redirect := r.FormValue("redirect") + "?error=" + url.PathEscape(fmt.Sprintf("Field %s: failed to parse %q as int32", name, values[0]))
						http.Redirect(w, r, redirect, http.StatusFound)
						return
					}
					field.Set(reflect.ValueOf(int32(i)))
				case reflect.String:
					field.Set(reflect.ValueOf(values[0]))
				}
			}
		}
		reply := reflect.New(method.Type.In(3).Elem())
		inputs := []reflect.Value{reflect.ValueOf(service), reflect.ValueOf(r), args, reply}
		err := method.Func.Call(inputs)[0]
		if !err.IsNil() {
			errString := err.MethodByName("Error").Call(nil)[0].Interface().(string)
			redirect := r.FormValue("redirect") + fmt.Sprintf("?error=%s", url.PathEscape(errString))
			http.Redirect(w, r, redirect, http.StatusFound)
			return
		}
		http.Redirect(w, r, r.FormValue("redirect"), http.StatusFound)
	}
}
