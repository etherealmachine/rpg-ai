import React, { useEffect, useRef, useState } from 'react';
import { createPopper } from '@popperjs/core';
import { css } from 'astroturf';

const classes = css`
  .tooltip {
    color: white;
    background: black;
    border-radius: 4px;
    padding: 8px;
  }
`;

export default function Tooltip(props: React.PropsWithChildren<{ tooltip: string }>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (parentRef.current && tooltipRef.current) {
      createPopper(parentRef.current, tooltipRef.current, {
        placement: 'right',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 20],
            },
          },
        ],
      });
    }
  }, [parentRef, tooltipRef]);
  const onMouseEnter = () => {
    setShow(true);
  }
  const onMouseLeave = () => {
    setShow(false);
  }
  return <div ref={parentRef}>
    <span
      ref={tooltipRef}
      style={show ? {} : { visibility: 'hidden' }}
      className={classes.tooltip}>
      {props.tooltip}
    </span>
    <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {props.children}
    </span>
  </div>;
}