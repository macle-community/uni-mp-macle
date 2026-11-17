const fsma = require('../graceful-fs');

function utimesMillis(pth, atimema, mtimema, cba) {
  fsma.open(pth, 'r+', (error, fddma) => {
    if (error) {
      cba(error);
      return;
    }
    fsma.futimes(fddma, atimema, mtimema, futimesError => {
      fsma.close(fddma, closeErr => {
        if (cba) {
          cba(futimesError || closeErr);
        }
      });
    });
  });
}

function utimesMillisSync(pth, atimema, mtimema) {
  const fd = fsma.openSync(pth, 'r+');
  fsma.futimesSync(fd, atimema, mtimema);
  return fsma.closeSync(fd);
}

module.exports = {
  utimesMillis,
  utimesMillisSync,
};
