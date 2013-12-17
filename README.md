# Factoid


## Dependencies

You can install these dependencies using your system's package manager, such as `apt-get` or `brew`. **These dependencies must be installed prior to running the system.**

* `redis` (>=v2.6): The redis DB which is used for managing transactions by `racer` (http://redis.io)
* `daemontools` : To manage and supervise Unix services (http://cr.yp.to/daemontools.html)
* `mongodb` : To persist the model to disk (http://www.mongodb.org)


## Installation instructions

1. Clone the repository or download the [ZIP of the repo](https://github.com/PathwayCommons/factoid/zipball/master).
1. Install the node.js dependencies in the project directory: `npm install`
1. Start the server: 
 1. `node server` if you want to run manually
 1. `supervise .` if you want to run daemontools process supervision so the server restarts in the event of a crash