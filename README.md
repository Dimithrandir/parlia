<img src="./logo.svg" alt="logo" width="128px" height="128px"/>

Parlia is a browser-based javascript library for building parliament diagrams in SVG format.

It's written in pure javascript with the aim to be minimal with zero dependencies while still offering various settings.

[Test it out here](https://dimithrandir.github.io/parlia/).


## Installation

Install from npm with `npm i parlia` or get `parlia.js` from this repo, put it in your project and include it in your page:

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

This would generate the following diagram:

<img src="./parliament-example.svg" alt="example diagram" width="578px" height="362px"/>

The data has to be given as an array with items describing each party, either as other arrays, where each one has the following format: `[id, color, name, seats]`; or objects with properties `{id, color, name, seats}`; where `id` is unique number, e.g.:

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

## Documentation

### Public methods:

- ### drawParliament()

Main function, does all the calculations for the given arguments and draws the parliament in the given SVG DOM object.

Returns an object with the total number of seats in the parliament and the number of actually drawn seats. If the proportion values are too extreme, there might not be enough room for all the seats and these two values will not be equal. Instead of throwing an exception, a warning caption is drawn over the parliament.


#### Parameters

`svg` - Reference to the SVG DOM object where the parliament is drawn.

`data` - Array of parties. Parties are represented as either objects with four properties:

	`id` - number - unique id
	
	`color` - string - color of party seats, given as a name or hexidecimal value

	`name` - string - party name

	`seat` - number - number of seats

	or arrays with four items, each taking the given properties in the given order.

`rInner` - A number representing the inner radius of the parliament as a fraction of the total width of the parliament, or the "thickness" of the parliament. E.g. a value of 5 means the inner radius is 1/5 of the parliament width. Defaults to `5.0`.

`rDenom` - A number representing the denominator in the fraction that is the ratio of the side of a square with area equal to each seat's share of the parliament, to the radius of the actual seat. A value of 2.5 means the ratio of side to radius is 1/2.5. Defaults to `2.5`.

`sortField` - A number determining which party property will the parties be sort by in the parliament. `0` for `id`, `1` for `name`, `3` for `seats`. Default is `0`.

`sortOrder` - A number determining the sort order. `0` for ascending, `1` for descending, `2` for alternating. Default is `0`.

`border` - Draw a border around each seat. Default is `true`.

`shadow` - Draw a shadow under each seat. Default is `true`.

`background` - Parliament background color. Default is `#f2f2f2`.

`padding` - Padding between the edge of the SVG element and the parliament in pixels. Default is `12`.

`centralAngle` - A number representing the central angle over which the parliament spans in degrees. Values over 180 have no effect. Default is `180`.

#### Return value

An object with two properties:

`seatsTotal` - Sum of seats of all parties in the given data.

`seatsDrawn` - Total number of seats drawn in the parliament.

- ### drawError()

Draw a caption with an error message over the parliament. Called when the arguments of drawParliament() don't allow all the seat to be drawn.

#### Parameters

`svg` - Reference to the SVG DOM object where the parliament is drawn.

`title` - Title of the caption. 

`subtitle` - Subtitle of the caption. 

- ### downloadParliament()

Download the generated SVG.

#### Parameters

`svg` - Reference to the SVG DOM object where the parliament is drawn.

- ### parseFromCsv()

Reads from a CSV file and parses to the preferred data format. Throws exceptions if the data is not in the correct format.

#### Parameters

`file` - A File object.

- ### parseToCsv()

Write the parties to a CSV file.

#### Parameters

`data` - An array of parties.

### Public properties:

- ### selectedParties

A Set of class names for the parties that are currently selected. Selected parties' seats have full opacity. Empty list means everything is selected (default).
