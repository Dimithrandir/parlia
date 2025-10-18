// Parlia
// 0.1.0


(function (root, factory) {

	if (typeof define === "function" && define.amd) {
		define(factory);
	}
	else if (typeof module === "object" && module.exports) {
        module.exports = factory();
	}
	else {
		root.Parlia = factory();
	}

}(typeof self !== "undefined" ? self : this, function () {
	
	"use strict";

	// svg namespace 
	const SVGNS = "http://www.w3.org/2000/svg";
	const SVG_COMMENT = "<!-- Created with parlia -->";
	const SVG_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>";
	const SVG_NAME = "parliament.svg";

	const CSV_HEADER = "id,color,name,seats";
	const CSV_NAME = "parties.csv";

	// default values
	const DEFAULTS = {
		rInner: 5.0,
		rDenom: 2.5,
		sortField: 0,
		sortOrder: 0,
		border: true,
		shadow: true,
		background: "#f2f2f2",
		padding: 12
	};

	// set of currently selected parties class names
	// empty if all selected (default)
	var selectedParties = new Set();

	var nParties = 0;


	var Parlia = {};
	Parlia.DEFAULTS = DEFAULTS;
	Parlia.drawParliament = drawParliament;
	Parlia.drawError = drawError;
	Parlia.selectedParties = selectedParties;
	Parlia.downloadParliament = downloadParliament;
	Parlia.parseFromCsv = parseFromCsv;
	Parlia.parseToCsv = parseToCsv;


	/*
	Main function. Draw the parliament for given data in a given SVG element.
	Do all the calculations based on the SVG element dimensions and provided arguments.
	*/
	function drawParliament(
		svg,
		data,
		rInner = DEFAULTS.rInner,
		rDenom = DEFAULTS.rDenom,
		sortField = DEFAULTS.sortField,
		sortOrder = DEFAULTS.sortOrder,
		border = DEFAULTS.border,
		shadow = DEFAULTS.shadow,
		background = DEFAULTS.background,
		padding = DEFAULTS.padding
	) {

		// parse data
		let parties = parseData(data);

		// clear the SVG element
		svg.innerHTML = "";

		// clear selection
		selectedParties.clear();

		nParties = parties.length;


		// get SVG element dimensions - used as basis for all values
		let svgRect = svg.getBoundingClientRect();


		// colored background
		let backRect = {};
		backRect.width = svgRect.width;
		backRect.height = svgRect.height;
		backRect.left = 0;
		backRect.top = 0;


		// 2:1 rectangle where the parliament is drawn
		let parlRect = {width: svgRect.width, height: svgRect.height};
		// calculate the parliament area inside the SVG (must be 2:1 ratio)
		let svgRectRatio = svgRect.width / svgRect.height;
		if (svgRectRatio > 2.0) {
			parlRect.width = svgRect.height * 2.0;
			parlRect.height = svgRect.height;
		}
		else if (svgRectRatio < 2.0) {
			parlRect.width = svgRect.width;
			parlRect.height = svgRect.width / 2.0;
		}
		parlRect.width -= 2 * padding;
		parlRect.height -= padding;
		parlRect.left = (svgRect.width - parlRect.width) / 2.0;
		parlRect.top = (svgRect.height - parlRect.height) / 2.0;
		parlRect.area = parlRect.width * parlRect.height;


		// the parliament takes a shape of a semicircle
		let parlSemi = {};
		parlSemi.r1 = parlRect.width / rInner;  // inner radius
		parlSemi.r2 = parlRect.width / 2.0;  // outer radius 
		parlSemi.t = parlSemi.r2 - parlSemi.r1;  // thickness
		parlSemi.area = Math.PI * (parlSemi.r2 - parlSemi.r1) * (parlSemi.r2 + parlSemi.r1) / 2.0;


		// total number of seats in the parliament
		let nSeats = 0;
		parties.forEach((item) => nSeats += item.seats);


		// helper object, hypothetical square with area one nSeats-th of the semicircle area
		let square = {};
		square.area = parlSemi.area / nSeats;
		square.a = Math.sqrt(square.area);


		// each seat is represented as a circle with radius that's a fraction of the side of the hypothetical square
		let seat = {};
		seat.r = square.a / rDenom;


		// parliament is consisted of multiple rows of seats
		let rows = [];
		// number of rows = max number of seats that would fit in the semicircle radially
		let nRows = Math.floor(parlSemi.t / (2 * seat.r));

		for (let i = 1; i <= nRows; i++) {
			// row of seats, its thickness is the seat radius plus the top+bottom margin
			let row = {};
			// radial margin (same for every row)
			row.marginRad = (parlSemi.t - nRows * (2 * seat.r)) / (2 * nRows);
			// row radius (including the margin)
			row.r = parlSemi.r1 + (seat.r + row.marginRad) * (2 * i - 1);
			// row length (as 180° arc)
			row.l = row.r * Math.PI;
			// angle of the arc with seat radius as cord
			row.theta = Math.asin(seat.r / row.r);
			// arc of the row covered by a single seat (same for every seat)
			seat.arc = 2 * row.theta * row.r;
			// max number of seats for current row
			row.kSeats = Math.floor(row.l / seat.arc);
			// circumferential margin (arc length between two seats in this row)
			row.marginCirc = (row.l - row.kSeats * seat.arc) / (row.kSeats - 1);
			// angle of the circumferential margin arc
			row.beta = row.marginCirc / row.r;

			rows.push(row);
		}


		// don't try to draw anything if no rows
		if (rows.length == 0) {
			return [nSeats, 0];
		}


		// calculate the actual number of seats per row by removing a seat from the row with the lowest circumferential margin until we reach the real total number of seats
		while (true) {
			// current number of seats for all rows (max at start)
			let sum = 0;
			for (let row of rows) {
				sum += row.kSeats;
			}
			// 
			if (sum <= nSeats) {
				break;
			}
			// find the row with min circumferential margin
			let min = rows[0].marginCirc;
			let minIndex = 0;
			for (let i = 1; i < rows.length; i++) {
				if (rows[i].marginCirc < min) {
					min = rows[i].marginCirc;
					minIndex = i;
				}
			}
			// remove a seat
			rows[minIndex].kSeats--;
			// update arc length between two seats on the row
			rows[minIndex].marginCirc = (rows[minIndex].l - rows[minIndex].kSeats * seat.arc) / (rows[minIndex].kSeats - 1);
			// update angle of the seat margin arc
			rows[minIndex].beta = rows[minIndex].marginCirc / rows[minIndex].r;
		}


		// number of seat of the top (outermost) row
		let topRowSeats = rows[nRows-1].kSeats;
		// matrix representation of the parliament
		let seatMatrix = Array.from({length: nRows}, (v, i) => 
			Array.from({length: topRowSeats}, (v, j) => {
				let curRowSeats = rows[i].kSeats;
				let seatDiff = (topRowSeats - curRowSeats) / 2;
				return (j < Math.ceil(seatDiff) || j > topRowSeats - 1 - Math.floor(seatDiff)) ? -1 : 0;
			})
		);


		// sort the parties by given field
		switch (sortField) {
			// party id
			case 0:
				parties = parties.sort((a, b) => a.id - b.id);	
				break;
			// seat number
			case 1:
				parties = parties.sort((a, b) => a.seats - b.seats);	
				break;
			// name
			case 2:
				parties = parties.sort((a, b) => a.name.localeCompare(b.name));	
				break;
			default:
				break;
		}


		// order the parties in given mode
		switch (sortOrder) {
			// descending
			case 1:
				parties.reverse();
				break;
			// alternating
			case 2:
				if (sortField == 1) {
					parties.reverse();
				} 
				parties = parties.filter((item, i) => i % 2 == 0).concat(parties.filter((item, i) => i % 2 != 0).reverse());
				break; 
			// ascending
			default:
				break;
		}

		
		// tag the seats
		let dataIndex = 0;
		let dataCounter = 0;
		// zigzag the seatMatrix vertically and tag the valid seats
		for (let j = 0; j < topRowSeats; j++) {
			for (let i = (j % 2 == 0) ? nRows - 1 : 0; i >= 0 && i < nRows; (j % 2 == 0) ? i-- : i++) {
				// if valid seat
				if (seatMatrix[i][j] == 0) {
					// go to the next party
					if (dataCounter >= parties[dataIndex].seats) {
						dataIndex++;
						dataCounter = 0;
					}
					seatMatrix[i][j] = dataIndex;
					dataCounter++;
				}
			}
		}


		// remove empty slots from seatMatrix
		for (let i = 0; i < nRows; i++) {
			seatMatrix[i] = seatMatrix[i].filter((el) => el != -1);
		}


		// draw the rows
		let seatCounter = 0;
		for (let i = 0; i < nRows; i++) {
			for (let j = 0, alpha = rows[i].theta; j < rows[i].kSeats; j++, alpha += (2 * rows[i].theta + rows[i].beta)) {
				seat.cx = parlRect.left + parlSemi.r2 - Math.cos(alpha) * rows[i].r;	// the adjacent cathetus
				seat.cy = parlRect.top + parlRect.height - Math.sin(alpha) * rows[i].r;	// the opposite cathetus

				let party = parties[seatMatrix[i][j]];

				drawSeat(seat.cx, seat.cy, seat.r, party.color, party.name, party.id, svg, border, shadow);
				// count the actual drawn seats, to see if they all fit
				seatCounter++;
			}
		}


		// draw the background rectangle
		drawRect(backRect, svg, background);


		// draw error caption if can't fit all the seats
		if (nSeats != seatCounter) {
			drawError(svg, "CAN'T FIT ALL SEATS", "Try reducing the seat size");
		}


		return {seatsTotal: nSeats, seatsDrawn: seatCounter};
	}


	function drawRect(parlRect, svg, color) {
		let rect = document.createElementNS(SVGNS, "rect");
		rect.setAttribute("width", parlRect.width);
		rect.setAttribute("height", parlRect.height);
		rect.setAttribute("x", parlRect.left);
		rect.setAttribute("y", parlRect.top);
		rect.setAttribute("fill", color);
		rect.setAttribute("class", "parlRect");
		rect.addEventListener("click", () => click());
		// title element for tooltip
		let title = document.createElementNS(SVGNS, "title");
		title.innerHTML = "Parliament";
		rect.appendChild(title);
		// add the rect as top sibling (behind everything)
		svg.insertBefore(rect, svg.firstChild);
	}


	function drawSeat(cx, cy, r, color, name, id, svg, border, shadow) {
		let circle = document.createElementNS(SVGNS, "circle");
		circle.setAttribute("cx", cx);
		circle.setAttribute("cy", cy);
		circle.setAttribute("r", r);
		circle.setAttribute("fill", color);
		circle.setAttribute("class", "seat-party-" + id);
		if (border) {
			circle.setAttribute("stroke", "black");
			circle.setAttribute("stroke-width", 2);
		}
		circle.addEventListener("click", () => click(id));

		// title element for tooltip
		let title = document.createElementNS(SVGNS, "title");
		title.innerHTML = name;
		circle.appendChild(title);

		// add the circle
		svg.appendChild(circle);

		if (shadow) {
			let shadow = document.createElementNS(SVGNS, "circle");
			shadow.setAttribute("cx", cx + 3);
			shadow.setAttribute("cy", cy + 5);
			shadow.setAttribute("r", r);
			shadow.setAttribute("fill", "black");
			shadow.setAttribute("opacity", "80%");	
			shadow.setAttribute("class", "shadow-party-" + id);
			// add the shadow as top sibling (behind all the seats)
			svg.insertBefore(shadow, svg.firstChild);
		}
	}

	function drawError(svg, title, subtitle) {
		let svgRect = svg.getBoundingClientRect();

		let rect = document.createElementNS(SVGNS, "rect");
		rect.setAttribute("width", svgRect.width / 2 + svgRect.width / 10);
		rect.setAttribute("height", svgRect.height / 3);
		rect.setAttribute("x", svgRect.width / 4 - svgRect.width / 20);
		rect.setAttribute("y", svgRect.height / 3);
		rect.setAttribute("stroke", "black");
		rect.setAttribute("stroke-width", 8);
		rect.setAttribute("fill", "white");

		let text1 = document.createElementNS(SVGNS, "text");
		text1.setAttribute("x", svgRect.width / 2);
		text1.setAttribute("y", svgRect.height / 2);
		text1.setAttribute("fill", "#000");
		text1.setAttribute("font-size", "25");
		text1.style.textAnchor = "middle";
		text1.style.fontFamily = "sans-serif";
		text1.innerHTML = title;

		let text2 = document.createElementNS(SVGNS, "text");
		text2.setAttribute("x", svgRect.width / 2);
		text2.setAttribute("y", svgRect.height / 2 + svgRect.height / 10);
		text2.setAttribute("fill", "#000");
		text2.setAttribute("font-size", "18");
		text2.style.textAnchor = "middle";
		text2.style.fontFamily = "sans-serif";
		text2.innerHTML = subtitle;

		svg.appendChild(rect);
		svg.appendChild(text1);
		svg.appendChild(text2);
	}


	// download the svg image
	function downloadParliament(svg) {
		let svgCode = SVG_HEADER + "\n" + SVG_COMMENT + "\n" + svg.outerHTML;

		let a = document.createElement("a");
		a.href =  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgCode);
		a.download = SVG_NAME;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

	}


	function click(id) {
		// seat clicked
		if (typeof id == "number") {
			let selectedClass = "seat-party-" + id;
			if (selectedParties.has(selectedClass)) {
				selectedParties.delete(selectedClass);
			}
			else {
				selectedParties.add("seat-party-" + id);
			}
			if (selectedParties.size == nParties) {
				selectedParties.clear();
			}
		}
		// background clicked
		else {
			if (selectedParties.size == 0) {
				return;
			}
			selectedParties.clear();
		}
		setOpacity();
	}


	// make only selected seats have full opacity
	// non-selected seats get 20%, non-selected shadows 0%
	function setOpacity() {

		for (let seat of document.getElementsByTagName("circle")) {
			if (selectedParties.size == 0 || selectedParties.has(seat.getAttribute("class").replace("shadow", "seat"))) {
				seat.setAttribute("opacity", (seat.getAttribute("class").includes("shadow")) ? "80%" : "100%");	
			}
			else {
				seat.setAttribute("opacity", (seat.getAttribute("class").includes("shadow")) ? "0%" : "20%");	
			}
		}
	}


	function toRadians(angle) {
		return angle * (Math.PI / 180);
	}


	function toDegrees(angle) {
		return angle * (180 / Math.PI);
	}


	function parseData(data) {
		// array of arrays
		if (Array.isArray(data) && Array.isArray(data[0])) {
			if (data.every((item) => {
				return (typeof item[0] === "number" &&
					typeof item[1] === "string" &&
					typeof item[2] === "string" &&
					typeof item[3] === "number");
			})) {
				let result = [];
				data.forEach((item) => result.push({
					id: item[0],
					color: item[1],
					name: item[2],
					seats: item[3]
				}));
				return result;
			} 
			else {
				throw new TypeError("Party values not of expected type.");
			}
		}
		// array of objects
		else if (Array.isArray(data) && data[0] instanceof Object) {
			if (data.every((item) => {
				return (CSV_HEADER.split(",").every((prop) => Object.hasOwn(item, prop)) &&
					typeof item.id === "number" &&
					typeof item.color === "string" &&
					typeof item.color === "string" &&
					typeof item.seats === "number");
			})) {
				return data;
			} 
			else {
				throw new TypeError("Party values not of expected type.");
			}
		}
		else {
			throw new TypeError("Party values not of expected type.");
		}
	}


	function parseToCsv(data) {

		let text = CSV_HEADER;
		data.forEach((item) => text += `\n${item.id},${item.color},${item.name},${item.seats}`);
		let blob = new Blob([text], {type: "text/csv"});
		let a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = CSV_NAME;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}


	// Parse a File object to an array of objects with correct properties
	// Return a promise with file content parsed to array of objects
	function parseFromCsv(file) {

		return new Promise((resolve, reject) => {

			let reader = new FileReader();

			reader.onload = () => {
				let result = [];
				let rows = reader.result.split("\n");
				// check header first
				if (rows[0].toLowerCase().replaceAll(" ", "").split(",")
					.every(header => CSV_HEADER.includes(header))) {
					rows.slice(1).forEach(row => {
						let party = row.split(",");
						// check row
						if (party.length == 4 &&
							!isNaN(parseInt(party[0])) &&
							!isNaN(parseInt(party[3]))) {
							result.push({
								id: parseInt(party[0]),
								color: party[1],
								name: party[2],
								seats: parseInt(party[3])		
							});
						}
						// ignore row if it's empty string, else reject promise
						else if (row) {
							reject(new Error("Invalid CSV content."));
						}
					});
					resolve(result);
				}
				else {
					reject(new Error("Invalid CSV file header."));
				}
			};

			reader.onError = (e) => {
				reject(e);
			};

			reader.readAsText(file);
		});
	}
	
	return Parlia;
}));
