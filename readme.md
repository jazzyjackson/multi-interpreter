I have this dream of writing a web server that walks you through the process of configuring itself for your needs.
Kind of like that cow in the Restaurant at the End of the Universe that recommends its own liver, and rolls its eyes when you ask for a salad.

SO, this might be a little weird, but running 'node motherscript.js' spins up a child processes to route network requests to, and she boots a repl so you can run functions or bash commands, and you can ask questions via ChatScript integration, all while the mother process is tracking network traffic, memory usage, and git versioning. This is paired with clientside javascript that allows files to be created on the server, and even allows those files to be executed. Programs assembled within the clientside application can even be written to disk and have their results piped through one another, allowing for prototyping of data pipelines. Once programs are written to disk, they are immediately available as a public API (if the programs are executable by guest users, more on that later.)

Some notes on the process: 

localhost:3000 is redirected to guest.localhost:3000, and when guest is used as a subdomain, the request is proxy'd to the node process created just for that subdomain.

In this way (in the near future), node processes can be spawned with a particular user ID on the unix OS underlying the server, allowing unix to handle file and executable permissions.

The way I'm redirecting and proxying to child processes based on a subdomain works fine with any browser if the server is named through a DNS service (ie hosted with a url). If you're connecting to the server via localhost, you can use chrome with no trouble. Other browsers automatically perform DNS lookup on the subdomain.localhost address and of course it doesn't find anything, so to use browsers other than chrome you must edit your system's HOSTS file and resolve each subdomain you want to use on your localhost to the proper address, like so:
```
127.0.0.1 localhost
127.0.0.1 guest.localhost
127.0.0.1 somethingelse.localhost
```