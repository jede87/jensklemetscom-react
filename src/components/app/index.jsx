import React from 'react';
import Fade from 'react-reveal/Fade';
import './app.scss';

export default () => {
  return (
    <>
      <header className="container">
        <div className="row">
          <div className="col-12 mt-5">
            <div className="text-center">
              <h1 className="display-1 mb-0">Jens Klemets</h1>
              <p className="lead">developer | techno dj</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mt-4">
        <div className="row">
          <div className="col-6">
            <Fade left delay={600}>
              <div className="card mt-2">
                <div className="card-body">
                  <h2 className="text-center display-3">Developer</h2>
                  <p className="text-center lead">
                    Jens is a great front end developer and has over 10 years of
                    documented experience. He has experience from a wide range
                    of projects.
                  </p>
                  <button
                    className="btn btn-primary btn-lg btn-block"
                    onClick={() => console.log('go to linkedin')}
                  >
                    LinkedIn
                  </button>
                </div>
              </div>
            </Fade>
          </div>
          <div className="col-6">
            <div className="card mt-2">
              <Fade right delay={1000}>
                <div className="card-body">
                  <h2 className="text-center display-3">DJ</h2>
                  <p className="text-center lead">
                    Jens has a broad taste in music and do all types of events.
                    He has his own techno show on SoundCloud playing his latest
                    findings.
                  </p>
                  <button
                    className="btn btn-warning btn-lg btn-block"
                    onClick={() => console.log('go to soundcloud')}
                  >
                    SoundCloud
                  </button>
                </div>
              </Fade>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
