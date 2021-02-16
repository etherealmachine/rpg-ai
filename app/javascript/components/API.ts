import Turbolinks from 'turbolinks';

export function call(controller: string, id: number, data: any, method = "GET") {
  const request = new XMLHttpRequest();
  request.open(method, `/${controller}/${id}`);
  const promise = new Promise(function (resolve, reject) {
    request.onreadystatechange = function () {
      if (request.readyState !== 4) return;
      if (request.status >= 200 && request.status < 300) {
        resolve(request);
        Turbolinks.visit(`/${controller}`, { action: "replace" });
      } else {
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }
    };
  });
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  request.send(JSON.stringify(data));
  return promise;
}