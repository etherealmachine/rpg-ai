import React, { useEffect, useRef, useState } from 'react';
import { findDOMNode } from 'react-dom';
import ReactTags from 'react-tag-autocomplete';

interface Tag {
  id: number
  name: string
}

function TagSelector(props: { tags: Tag[] }) {
  const ref = useRef(null);
  const [tags, setTags] = useState<Tag[]>(props.tags);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  useEffect(() => {
    fetch('/tags?format=json')
      .then(response => response.json())
      .then(setSuggestions);
  }, []);
  const syncWithHiddenTextField = (tags: Tag[]) => {
    if (ref.current) {
      const node = findDOMNode(ref.current);
      const hiddenInput = node.parentElement.parentElement.querySelector("input[hidden='hidden'][type='text']");
      if (hiddenInput && hiddenInput instanceof HTMLInputElement) {
        hiddenInput.value = tags.map(tag => tag.name).join(',');
      }
    }
  };
  const onDelete = (i: number) => {
    const newTags = tags.slice(0);
    newTags.splice(i, 1);
    setTags(newTags);
    syncWithHiddenTextField(newTags);
  };
  const onAddition = (tag: Tag) => {
    const newTags = [].concat(tags, tag)
    setTags(newTags);
    syncWithHiddenTextField(newTags);
  };
  return <ReactTags
    ref={ref}
    tags={tags}
    suggestions={suggestions}
    onDelete={onDelete}
    onAddition={onAddition} />;
}

export default TagSelector;