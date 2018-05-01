
IN PROGRESS. COME BACK LATER.

The Benchling non-free web app has the ability to manually export a zip file of an entire project.

This is an attempt at a script that will wait for such a zip file to appear in a specified directory, parse the html of the lab notes and output them in a more appropriate format for e.g. use on static website.

# Usage

```
./cmd.js dir_to_watch output_dir
```

Where `dir_to_watch` is a directory to watch for a new zip file to appear and `output_dir` is where to write the output.

# Current features

Finds all html files, parses out the individual labnote entries and writes them to a single index.html file.

# ToDo

* Differentiate between protocols and lab notes
* Order lab notes by date-time
* Get CSS working

# License and copyright

Copyright 2018 Marc Juul

License: AGPLv3


