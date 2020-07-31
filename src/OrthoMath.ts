export function* rasterizeLine(x0: number, y0: number, x1: number, y1: number) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let mirror = false;
  if (dy > dx) {
    let tmp = x0;
    x0 = y0;
    y0 = tmp;
    tmp = x1;
    x1 = y1;
    y1 = tmp;
    mirror = true;
  }
  if (x0 > x1) {
    let tmp = x0;
    x0 = x1;
    x1 = tmp;
    tmp = y0;
    y0 = y1;
    y1 = tmp;
  }

  dx = x1 - x0;
  dy = y1 - y0;

  let yDir = 1;
  let dEpsilon = dy;
  if (dy <= 0) {
    yDir = -1;
    dEpsilon = -dy;
  }

  let epsilon = 0;
  let x = x0;
  let y = y0;

  do {
    if (mirror) {
      yield ({ x: y, y: x });
    } else {
      yield ({ x: x, y: y });
    }
    x = x + 1;
    epsilon = epsilon + dEpsilon;

    if ((epsilon << 1) > dx) {
      epsilon = epsilon - dx;
      y = y + yDir;
    }
  } while (x <= x1);
}