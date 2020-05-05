package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
)

type Service struct {
	Name         string
	Methods      []*Method
	OtherStructs []*StructDef
}

type Method struct {
	Name        string
	RequestDef  *StructDef
	ResponseDef *StructDef
}

type StructDef struct {
	Name   string
	Fields []*Field
}

type Field struct {
	Name string
	Type string
}

func NewStructDef(t reflect.Type, structs map[string]*StructDef) *StructDef {
	if t.Kind() != reflect.Struct && t.Kind() != reflect.Ptr {
		panic(fmt.Sprintf("expected struct or ptr, gor %s", t.Kind()))
	}
	var fields []*Field
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	nameParts := strings.Split(t.Name(), ".")
	name := nameParts[len(nameParts)-1]
	if def := structs[name]; def != nil {
		return def
	}
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		if strings.ToLower(f.Name) == f.Name {
			continue
		}
		jsType, err := TypeToJS(f.Type, structs)
		if err != nil {
			panic(fmt.Sprintf("%s field %s: %v", t.Name(), f.Name, err))
		}
		fields = append(fields, &Field{
			Name: f.Name,
			Type: jsType,
		})
	}
	def := &StructDef{
		Name:   name,
		Fields: fields,
	}
	structs[def.Name] = def
	return def
}

func TypeToJS(t reflect.Type, structs map[string]*StructDef) (string, error) {
	if t.Name() == "Time" {
		return "Date", nil
	}
	switch t.Kind() {
	case reflect.Invalid:
		return "", errors.New("Kind is 'invalid'")
	case reflect.Bool:
		return "boolean", nil
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64, reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr, reflect.Float32, reflect.Float64:
		return "number", nil
	case reflect.String:
		return "string", nil
	case reflect.Struct:
		def := NewStructDef(t, structs)
		return def.Name, nil
	case reflect.Array, reflect.Slice:
		if k := t.Elem().Kind(); k == reflect.Struct || k == reflect.Ptr {
			def := NewStructDef(t.Elem(), structs)
			return fmt.Sprintf("%s[] | null", def.Name), nil
		}
		if t.Elem().Kind() == reflect.Uint8 {
			return "string", nil
		}
		elementType, err := TypeToJS(t.Elem(), structs)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("%s[] | null", elementType), nil
	case reflect.Map:
		if k := t.Elem().Kind(); k == reflect.Struct || k == reflect.Ptr {
			NewStructDef(t.Elem(), structs)
		}
		keyType, err := TypeToJS(t.Key(), structs)
		if err != nil {
			return "", err
		}
		valueType, err := TypeToJS(t.Elem(), structs)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("{ [key: %s]: %s } | null", keyType, valueType), nil
	case reflect.Ptr:
		return TypeToJS(t.Elem(), structs)
	case reflect.Interface:
		return "any", nil
	default:
		return "", errors.New(fmt.Sprintf("Can't convert field %v to any Typescript type", t.Kind()))
	}
}

func generateJSONRPCService(service interface{}, dir string) error {
	t := reflect.TypeOf(service)
	s := &Service{
		Name: t.Elem().Name(),
	}
	structs := make(map[string]*StructDef)
	for i := 0; i < t.NumMethod(); i++ {
		method := t.Method(i)
		s.Methods = append(s.Methods, &Method{
			Name:        method.Name,
			RequestDef:  NewStructDef(method.Type.In(2), structs),
			ResponseDef: NewStructDef(method.Type.In(3), structs),
		})
	}
	for _, val := range structs {
		alreadyDefined := false
		for _, method := range s.Methods {
			if val.Name == method.RequestDef.Name || val.Name == method.ResponseDef.Name {
				alreadyDefined = true
			}
		}
		if !alreadyDefined {
			s.OtherStructs = append(s.OtherStructs, val)
		}
	}
	f, err := os.Create(filepath.Join(dir, s.Name+".ts"))
	if err != nil {
		return err
	}
	defer f.Close()
	WriteJSONRPCService(f, s)
	return nil
}
