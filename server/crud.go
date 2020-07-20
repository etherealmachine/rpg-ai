package main

import (
	"log"
	"net/http"
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
		argsType := method.Type.In(2).Elem()
		args := reflect.New(argsType)
		if err := r.ParseForm(); err != nil {
			log.Printf("Error in crud request: %s", err.Error())
			http.Redirect(w, r, r.Referer(), http.StatusFound)
			return
		}
		for i := 0; i < argsType.NumField(); i++ {
			fieldType := argsType.Field(i)
			if fieldType.Name == "OwnerID" {
				continue
			}
			value := r.FormValue(fieldType.Name)
			if value == "" && !strings.HasPrefix(fieldType.Type.Name(), "Null") {
				log.Printf(
					"Error in crud request: could not fill field %s (type %s.%s) with empty string",
					fieldType.Name, fieldType.Type.PkgPath(), fieldType.Type.Name())
				http.Redirect(w, r, r.Referer(), http.StatusFound)
				return
			}
			field := args.Elem().Field(i)
			switch {
			case fieldType.Type.Kind() == reflect.Int32:
				i, err := strconv.ParseInt(value, 10, 32)
				if err != nil {
					log.Println(err)
					http.Redirect(w, r, r.Referer(), http.StatusFound)
					return
				}
				field.Set(reflect.ValueOf(int32(i)))
			case fieldType.Type.Kind() == reflect.String:
				field.Set(reflect.ValueOf(value))
			case fieldType.Type.Name() == "NullInt32":
				if value != "" {
					i, err := strconv.ParseInt(value, 10, 32)
					if err != nil {
						log.Println(err)
						http.Redirect(w, r, r.Referer(), http.StatusFound)
						return
					}
					field.FieldByName("Int32").Set(reflect.ValueOf(int32(i)))
					field.FieldByName("Valid").Set(reflect.ValueOf(true))
				}
			case fieldType.Type.Name() == "NullString":
				if value != "" {
					field.FieldByName("String").Set(reflect.ValueOf(value))
					field.FieldByName("Valid").Set(reflect.ValueOf(true))
				}
			default:
				log.Printf(
					"Error in crud request: could not fill field %s (type %s.%s) from form value %q",
					fieldType.Name, fieldType.Type.PkgPath(), fieldType.Type.Name(), value)
				http.Redirect(w, r, r.Referer(), http.StatusFound)
				return
			}
		}
		reply := reflect.New(method.Type.In(3).Elem())
		inputs := []reflect.Value{reflect.ValueOf(service), reflect.ValueOf(r), args, reply}
		err := method.Func.Call(inputs)[0]
		if !err.IsNil() {
			log.Printf("Error in crud request: %s", err.MethodByName("Error").Call(nil)[0].Interface().(string))
			http.Redirect(w, r, r.Referer(), http.StatusFound)
			return
		}
		http.Redirect(w, r, r.Referer(), http.StatusFound)
	}
}
