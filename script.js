var mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "light";

var data = [];


var rInner = Parlia.DEFAULTS.rInner;
var rDenom = Parlia.DEFAULTS.rDenom;
var sortField = Parlia.DEFAULTS.sortField;
var sortOrder = Parlia.DEFAULTS.sortOrder;
var background = mode === "light" ? Parlia.DEFAULTS.background : "#130f1d";
var defaultColors = mode === "light" ? ["#ff0000", "#0000ff"] : ["#ee3333", "#66aaaa"];


// elements

const svg = document.getElementById("svg");

var labelSeats = document.getElementById("labelSeats");
var labelSeatsDrawn = document.getElementById("labelSeatsDrawn");
var labelSeatsSelected = document.getElementById("labelSeatsSelected");
var labelSeatsPercent = document.getElementById("labelSeatsPercent");

var containerParties = document.getElementById("parties");

var labelFileError = document.getElementById("labelFileError");

var sliderRadius = document.getElementById("sliderRadius");
var labelRadius = document.getElementById("labelRadius");

var sliderRatio = document.getElementById("sliderRatio");
var labelRatio = document.getElementById("labelRatio");

var checkBorder = document.getElementById("checkBorder");
var checkShadow = document.getElementById("checkShadow");

var inputBackground = document.getElementById("inputBackground");

inputBackground.value = background;

// listeners

window.addEventListener("resize", () => redraw());


document.getElementById("buttonAddParty").onclick = function() {
	addNewParty();
};


document.getElementById("buttonLoadFile").onchange = function() {

	if (this.files[0]) {
		Parlia.parseFromCsv(this.files[0]).then((result) => {
			// sort by id
			data = result.sort((a, b) => a.id - b.id);
			// update DOM elements
			containerParties.innerHTML = "";
			data.forEach((party) => addNewParty(party));
			labelFileError.style.display = "none";

			redraw();
		}).catch(error => {
			console.log(error);
			labelFileError.style.display = "block";
			labelFileError.innerHTML = error;
		});
	}
};


document.getElementById("buttonExportCsv").onclick = function() {
	Parlia.parseToCsv(data);
};


sliderRadius.oninput = function () {
	rInner= this.value / 10;
	labelRadius.innerHTML = rInner;
	redraw(); 
};


sliderRatio.oninput = function () {
	rDenom= this.value / 10;
	labelRatio.innerHTML = rDenom;
	redraw(); 
};


document.getElementById("radioSort").onchange = function(event) {
	sortField = parseInt(event.target.value);
	redraw(); 
};


document.getElementById("radioOrder").onchange = function(event) {
	sortOrder = parseInt(event.target.value);
	redraw(); 
};


checkBorder.onchange = redraw;


checkShadow.onchange = redraw;


inputBackground.oninput = function() {
	background = this.value;
	svg.getElementsByTagName("rect")[0].setAttribute("fill", background);
};


document.getElementById("buttonDefaults").onclick = function() {
	rInner = Parlia.DEFAULTS.rInner;
	rDenom = Parlia.DEFAULTS.rDenom;
	sliderRadius.value = Parlia.DEFAULTS.rInner * 10;
	sliderRatio.value = Parlia.DEFAULTS.rDenom * 10;
	labelRadius.innerHTML = rInner;
	labelRatio.innerHTML = rDenom;
	radioSortDefault.checked = true;
	radioOrderAscending.checked = true;
	sortField = sortOrder = 0;
	checkBorder.checked = checkShadow.checked = false;
	background = Parlia.DEFAULTS.background;
	inputBackground.value = background;

	redraw(); 
};


document.getElementById("buttonDownload").onclick = function() {
	Parlia.downloadParliament(svg);
};


document.getElementById("buttonCopy").onclick = function() {
	navigator.clipboard.writeText(svg.innerHTML);
};


svg.onclick = function() {
	if (Parlia.selectedParties.size == 0) {
		labelSeatsSelected.innerHTML = labelSeatsDrawn.innerHTML;
		labelSeatsPercent.innerHTML = "100%";
	}
	else {
		let num = 0;
		(Array.from(Parlia.selectedParties)).forEach((i) => {
			num += data[data.findIndex((j) => j.id == parseInt(i.split("-")[2]))].seats;
		});
		labelSeatsSelected.innerHTML = num;
		labelSeatsPercent.innerHTML = Math.floor(100 * num / parseInt(labelSeats.innerHTML)) + "%";
	}
};


// callbacks

function changeColor(id) {
	let element = document.getElementById("inputColor" + id);
	let i = data.findIndex((item) => item.id == id);
	data[i].color = element.value;
	redraw(); 
}


function changeName(id) {
	let element = document.getElementById("inputName" + id);
	let i = data.findIndex((item) => item.id == id);
	data[i].name = element.value;
	redraw(); 
}


// allow only digit and action keys in input number
function pressKeyDownNumber(event) {
	if (event.key.match(/[^0-9]/) && !event.key.match(/Enter|Backspace|Delete|Tab|Arrow.?/)) {
		event.preventDefault();
	}
}


function changeNumber(id) {
	let element = document.getElementById("inputSeats" + id);
	let i = data.findIndex((item) => item.id == id);
	data[i].seats = parseInt(element.value);
	redraw(); 
}


function removeParty(id) {
	// parliament must have at least one party
	if (data.length <= 1) {
		return;
	}
	let i = data.findIndex((item) => item.id == id);
	data = data.slice(0, i).concat(data.slice(i + 1));
	document.getElementById("party" + id).remove();
	redraw(); 
}


// add new elements with default values for a new party to document and to data
// and redraw the svg
// if party argument is not null, use its values instead
// (used when loading from a csv file, data and svg are already altered on csv loading)
function addNewParty(party = null) {

	// find next party index
	let partyIndex = 0;
	if (party) {
		partyIndex = party.id;
	}
	else {
		data.forEach((item) => partyIndex = Math.max(partyIndex, item.id));
		partyIndex++;
	}

	let newColor = party ? party.color : (partyIndex > 2) ? getRandomColor() : defaultColors[partyIndex-1];  // red & blue at start
	let newName = party ? party.name : "Party " + partyIndex;
	let newSeats = party? party.seats : 20;

	let divParty = document.createElement("div");
	divParty.id = "party" + partyIndex;
	divParty.setAttribute("class", "form-row");

	let inputColor = document.createElement("input");
	inputColor.id = "inputColor" + partyIndex;
	inputColor.setAttribute("type", "color");
	inputColor.setAttribute("value", newColor);
	inputColor.addEventListener("input", () => {changeColor(partyIndex);});

	let inputName = document.createElement("input");
	inputName.id = "inputName" + partyIndex;
	inputName.setAttribute("type", "text");
	inputName.setAttribute("value", newName);
	inputName.addEventListener("input", () => {changeName(partyIndex);});

	let inputSeats = document.createElement("input");
	inputSeats.id = "inputSeats" + partyIndex;
	inputSeats.setAttribute("type", "number");
	inputSeats.setAttribute("min", "1");
	inputSeats.setAttribute("step", "1");
	inputSeats.setAttribute("value", newSeats);
	inputSeats.addEventListener("change", () => {changeNumber(partyIndex);});
	inputSeats.addEventListener("keydown", () => {pressKeyDownNumber(event);});

	let inputRemove = document.createElement("input");
	inputRemove.id = "inputRemoveParty" + partyIndex;
	inputRemove.setAttribute("type", "button");
	inputRemove.setAttribute("value", "✖");
	inputRemove.addEventListener("click", () => {removeParty(partyIndex);});

	divParty.appendChild(inputColor);
	divParty.appendChild(inputName);
	divParty.appendChild(inputSeats);
	divParty.appendChild(inputRemove);

	containerParties.appendChild(divParty);

	if (party == null) {
		data.push({id: partyIndex, color: newColor, name: newName, seats: newSeats});
		redraw(); 
	}
}


// draw the parliament and update elements
function redraw() {

	let result = Parlia.drawParliament(svg, data, rInner, rDenom, sortField, sortOrder, checkBorder.checked, checkShadow.checked, background); 

	// status label update
	let svgRect = svg.getBoundingClientRect();
	document.getElementById("labelSvgSize").innerHTML = parseInt(svgRect.width) + " x " + parseInt(svgRect.height);
	labelSeats.innerHTML = result.seatsTotal;
	labelSeatsDrawn.innerHTML = result.seatsDrawn;
	labelSeatsSelected.innerHTML = result.seatsDrawn;
	labelSeatsPercent.innerHTML = "100%";
}


function getRandomColor() {
	let result = "#";
	for (let i = 0; i < 3; i++) {
		result += Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
	}
	return result;
}


// add two parties for start
addNewParty();
addNewParty();
