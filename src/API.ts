class API {

  raw_request(url: string): Promise<any> {
    var req = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      req.onreadystatechange = () => {
        if (req.readyState !== 4) return;
        if (req.status >= 200 && req.status < 300) {
          resolve(JSON.parse(req.responseText));
        } else {
          reject({
            status: req.status,
            statusText: req.statusText
          });
        }
      };
      req.open('GET', url, true);
      req.send();
    });
  }

  async listImages(): Promise<string[]> {
    return await this.raw_request(`http://localhost:5000/listImages`);
  }

  async searchImages(query: string): Promise<string[]> {
    return await this.raw_request(`http://localhost:5000/searchImages?q=${encodeURIComponent(query)}`);
  }

  async downloadImage(name: string, url: string): Promise<boolean> {
    return await this.raw_request(`http://localhost:5000/downloadImage?name=${name}&url=${encodeURIComponent(url)}`);
  }

  async listDataFiles(): Promise<string[]> {
    return await this.raw_request(`http://localhost:5000/listDataFiles`);
  }

}

export default API;