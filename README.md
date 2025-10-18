<p align="center"><img src="https://github.com/Dimithrandir/parlia/blob/master/logo.svg" alt="" width="128px" height="128px"/></p>
<h1 align="center">Parlia</h1>

Parlia is a browser-based javascript library for building parliament diagrams in SVG format.

It's written in pure javascript with the aim to be minimal with zero dependencies while still offering various settings.

Test it out here.


## Installation

Get `parlia.js` from this repo, put it in your project and include it in your page:

```
<script src="./parlia.js"></script>
```

## Usage

There are only two mandatory arguments you need to provide to the main method, a reference to a SVG element and the parties data.

```
let svg = document.getElementById("svg");
let data = [[1, "red", "Party 1", 12], [2, "blue", "Party 2", 12]];

Parlia.drawParliament(svg, data);
```

<img src="https://github.com/Dimithrandir/parlia/blob/master/parliament-example.svg" alt=""/>

The data has to be given as an array with items describing each party, either as other arrays, where each one has the following format: `[id, color, name, seats]`; or objects with properties `{id, color, name, seats}`; where `id` is unique number.  E.g.:

```
[... [7, "#f00", "My Party", 56], ...]

// or

[... {id: 7, color: "$f00", name: "My Party", seats: 56}, ...]
```

Alternatively, you can load from a CSV file:

```
id,color,name,seats
7,#f00,My Party,56
...
```
