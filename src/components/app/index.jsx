import React from "react";
import "./app.scss";

export default () => {
  return (
    <>
      <header>
        <div className="container">
          <div className="row">
            <div className="col-10">
              <ul class="list-inline mt-3 mb-0">
                <li class="list-inline-item h3 mr-4">Consultant</li>
                <li class="list-inline-item h3 mr-4">Performer</li>
                <li class="list-inline-item h3">Athlete</li>
              </ul>
            </div>
            <div className="col-2 text-right">
              <h1 className="mt-2 mb-1">JK</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="h-100 container">
        <div className="row">
          <div className="col-12 d-flex h-100 mt-5">
            <div class="card mt-2">
              <div class="card-body">
                <h2 className="display-2 text-md-center text-right">
                  Jens Klemets
                </h2>
                <p>
                  Etiam nec pretium dui. Maecenas accumsan aliquet ligula,
                  vulputate aliquam augue bibendum vitae. Donec ligula metus,
                  tincidunt at elementum eu, condimentum ut neque. Quisque quis
                  felis suscipit tortor malesuada consequat. Maecenas fermentum
                  est efficitur ullamcorper venenatis. Quisque volutpat lorem
                  dolor, quis pulvinar metus pharetra a. Duis at ornare sem, id
                  blandit tellus. Donec nec convallis tellus. Nullam sagittis
                  lobortis facilisis. Vestibulum in maximus augue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
