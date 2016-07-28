
function Game() {
	var letters           = null;
    var hintReceived      = false;
    var time              = null;
    var answerTime        = 0;
    var numRightAnswers   = 0;
	var probInc           = 6.0;
    var probDec           = 0.3333333333;
	var currentLetter     = null;
	var fonts             = ["FontA", "FontB", "FontC", "FontD"];
	var wrongAnswerStack  = [];
	var nextOccurenceFrom = 3;
	var nextOccurenceTo   = 9;

	this.start = function() {
		time          = new Date().getTime();
		letters       = this.genLetters("romaji");
		currentLetter = this.chooseLetter(Math.random());
	}
	this.genLetters = function(listType) {
		var romaji   = this.romaji();
		var hiragana = this.hiragana();
		var output   = [];

		for(var i=0; i<romaji.length; i++) {
			var index = i;

			if(romaji[index].length == 0) {
				continue;
			}
			if(listType == "romaji") {
				index = romaji[i];
			}
			if(listType == "hiragana") {
				index = hiragana[i];
			}
			output[index] = {
				romaji:        romaji[i],
				hiragana:      hiragana[i],
				katakana:      null,
				probability:   1.0,
				time:          0,
				right:         1,
				wrong:         1,
				font:          "",
				nextOccurence: 0,
				enabled:       true,
				index:         i
			};
		}
		return output;
	}
	this.sum = function(letters) {
		var s = 0.0;

		for(i in letters) {
			if(letters[i].enabled === true) {
				s = s + letters[i].probability;
			}
		}
		return s;
	}
	this.getCurrentLetter = function() {
		return currentLetter;
	}
	this.chooseProbableLetter = function(value) {
		var last;
		value = value * this.sum(letters);

		for(i in letters) {
			if(letters[i].enabled === true) {
				value = value - letters[i].probability;

				if(value <= 0.0) {
					letters[i].font = this.chooseRandomFont();
					return letters[i];
				}
			}
			last = i;
		}
		letters[last].font = this.chooseRandomFont();
		return letters[last];
	}
	this.chooseLetter = function(value) {
		var found = null;
		var i     = 0;

		while(i < wrongAnswerStack.length) {
			wrongAnswerStack[i].nextOccurence--;

			if(found == null && wrongAnswerStack[i].nextOccurence <= 0) {
				wrongAnswerStack[i].nextOccurence = 0;
				found = wrongAnswerStack[i];
				wrongAnswerStack.splice(i, 1);
				continue;
			}
			i++;
		}
		if(found != null) {
			return found;
		}
		return this.chooseProbableLetter(value);
	}
	this.updateProbability = function(mode, letter, duration, rightAnswer) {
		var average           = (numRightAnswers != 0) ? (answerTime / numRightAnswers) : (0);
		var numAnswers        = currentLetter.right + currentLetter.wrong - 2;
		var averageAnswerTime = currentLetter.time / numAnswers;

		letter.wrong = letter.wrong + (rightAnswer ? 0 : 1);
		letter.right = letter.right + (rightAnswer ? 1 : 0);
		letter.time  = letter.time + (rightAnswer ? duration : average);

		if(mode == "a") {
			letter.probability = letter.wrong / letter.right;

			if(numAnswers > 0 && numRightAnswers > 0) {
				letter.probability = letter.probability * (averageAnswerTime / average);
				letter.probability = letter.probability * letter.probability;
			}
		}
		if(mode == "b") {
			var timeMultiplicator = (average != 0.0) ? (duration / average) : (1.0);

			if(rightAnswer) {
				letter.probability = letter.probability * probDec * timeMultiplicator;
			}
			else {
				letter.probability = letter.probability * probInc;
			}
		}
	}
	this.processUserInput = function(value, mode) {
		var currTime = new Date().getTime();
        var maxTime  = 15000; // 15 seconds
		var result   = { display:0, input:0, time:0, font:0, right:0 };
        var letter   = letters[value];
        var hit      = true;
        var duration = Math.min(currTime - time, maxTime);

        if(letter == undefined) {
            letter = { index:"X" };
            hit    = false;
        }
        else if(letter.index != currentLetter.index) {
            hit = false;
        }
        if(hit) {
            if(!hintReceived) {
				this.updateProbability(mode, currentLetter, duration, true);
                answerTime = answerTime + duration;
                numRightAnswers++;
            }
			// choose a new letter randomly
			currentLetter = this.chooseLetter(Math.random());
			result.input  = "";
			result.right  = true;
            hintReceived  = false;
        }
        else {
            if(!hintReceived) {
				this.updateProbability(mode, currentLetter, duration, false);
				this.addWrongAnswer(currentLetter);
            }
			result.input = currentLetter.romaji;
			result.right = false;
            hintReceived = true;
        }
		result.font    = currentLetter.font;
		result.display = currentLetter.hiragana;
		result.time    = duration/1000.0 + " Sec";
        time           = currTime;
		return result;
	}
	this.whitelistLetters = function(list) {
		for(i in letters) {
			letters[i].enabled = (list[letters[i].index] == true) ? true : false;
		}
	}
	this.chooseRandomFont = function() {
		var n = parseInt(Math.round(Math.random() * 3.0));
		return fonts[n];
	}
	this.addWrongAnswer = function(letter) {
		letter.nextOccurence = parseInt(Math.round(nextOccurenceFrom + Math.random()*(nextOccurenceTo - nextOccurenceFrom)));
		wrongAnswerStack.push(letter);
	}
	this.genStatistics = function(container) {
		var div = $(container);
        var s   = this.sum(letters);
        var t   = (numRightAnswers != 0) ? (answerTime / numRightAnswers) : (0);
        div.html("");
        div.append("average time: " + (t / 1000.0) + " Sec<br>");

        for(i in letters) {
            var prob = (letters[i].enabled === true) ? (letters[i].probability / s * 100.0) : (0.0);
			var next = letters[i].nextOccurence;
            var text = letters[i].hiragana + ("" + prob).substr(0, 5) + "% : " + next;
            var html = $('<div class="stat-entry">' + text + '</div>');

			if(letters[i].enabled === true) {
				html.css("background-color", "orange");
			}
            div.append(html);
        }
	}
	this.romaji = function() {
		return [
			"a" , "i"  , "u"  , "e" , "o" ,
			"ka", "ki" , "ku" , "ke", "ko",
			"sa", "shi", "su" , "se", "so",
			"ta", "chi", "tsu", "te", "to",
			"na", "ni" , "nu" , "ne", "no",
			"ha", "hi" , "fu" , "he", "ho",
			"ma", "mi" , "mu" , "me", "mo",
			"ya", ""   , "yu" , ""  , "yo",
			"ra", "ri" , "ru" , "re", "ro",
			"wa", "wi" , ""   , "we", "wo",
			""  , ""   , ""   , ""  , "n",

			"ga", "gi" , "gu" , "ge", "go",
			"za", "ji" , "zu" , "ze", "zo",
			"da", "", "", "de", "do",
			"ba", "bi" , "bu" , "be", "bo",
			"pa", "pi" , "pu" , "pe", "po"
		];
	}
	this.hiragana = function() {
		return [
//          a     i     u    e     o
			"あ", "い", "う", "え", "お",
			"か", "き", "く", "け", "こ", // k
			"さ", "し", "す", "せ", "そ", // s
			"た", "ち", "つ", "て", "と", // t
			"な", "に", "ぬ", "ね", "の", // n
			"は", "ひ", "ふ", "へ", "ほ", // h
			"ま", "み", "む", "め", "も", // m
			"や", "" , "ゆ", ""  , "よ", // y
			"ら", "り", "る", "れ", "ろ", // r
			"わ", "ゐ", ""　, "ゑ", "を", // w
			""  , "" , ""  , ""  , "ん", // n

			"が", "ぎ", "ぐ", "げ", "ご", // g
			"ざ", "じ", "ず", "ぜ", "ぞ", // z
			"だ", "" , ""  , "で" , "ど", // d
			"ば", "び", "ぶ", "べ" , "ぼ", // b
			"ぱ", "ぴ", "ぷ", "ぺ" , "ぽ" // p
		];
	}
}

function genWritingArea(container, num, w, h) {
	var ctnr       = $(container);
	var letters    = [];
	var canvasList = [];

	for(var i=0; i<num; i++) {
		var div    = $('<div class="float-left margin-05em"></div>');
		var canvas = $('<canvas id="canvas' + i + '" class="letter-canvas clear" width="' + w +'" height="' + h + '"></canvas>');
		var button = $('<div class="play-button play float-left"></div>');

		div.data("index", i);
		div.append(button);
		div.append('<div class="letter-display"></div>');
		div.append(canvas);
		ctnr.append(div);

		var drawing   = false;
		var canvasObj = new Canvas("canvas" + i);
		canvasObj.init("X", "sans", true);
		canvasList.push(canvasObj);
/*
		button.click(function() {
			var index = $(this).parent().data("index");
			console.log("play " + index);
		});*/
		canvas.mousedown(function(e) {
			var o      = $(this).offset();
			var x      = e.pageX - o.left;
			var y      = e.pageY - o.top;
			var canvas = canvasList[$(this).parent().data("index")];
			canvas.begin(x, y);
			drawing = true;
		});
		canvas.mousemove(function(e) {
			if(drawing === true) {
				var o      = $(this).offset();
				var x      = e.pageX - o.left;
				var y      = e.pageY - o.top;
				var canvas = canvasList[$(this).parent().data("index")];
				canvas.addPoint(x, y);
				canvas.draw();
			}
		});
		canvas.mouseup(function(e) {
			if(drawing) {
				var canvas = canvasList[$(this).parent().data("index")];
				canvas.end();
				drawing = false;
			}
		});
		canvas.mouseleave(function() {
			if(drawing) {
				var canvas = canvasList[$(this).parent().data("index")];
				canvas.end();
				drawing = false;
			}
		});
	}
	ctnr.append('<div class="clear"></div>');
	return canvasList;
}

$(document).ready(function() {
/*
	audio.loadFile("audio/ma.mp3", "ma", function(url, id) {
		console.log("File " + url + ": loaded");
		audio.play(id);
	});
*/
	var whitelist = [];
	var game  = new Game();
	game.start();

	$("#letter").text(game.getCurrentLetter().hiragana);
	$("#user-input").val("");
	$("#user-input").focus();

	var canvasList = genWritingArea("#letter-writing", 5, 112, 150);
	var table      = new Table();
	var audio      = new Audio();
	var top        = ["a", "i", "u", "e", "o" ];
	var left       = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w", "", "g", "z", "d", "b", "p"];
	var hiragana   = game.hiragana();
	var romaji     = null;

	function genNewLetters() {
		romaji = [];

		for(var i=0; i<canvasList.length; i++) {
			var letter = game.chooseProbableLetter(Math.random());
			romaji.push(letter.romaji);
			canvasList[i].init(letter.hiragana, false);
			$("#letter-writing > div:eq(" + i + ") > .letter-display").text(letter.romaji);
		}
	}
	genNewLetters();

	$(".play-button").click(function() {
		var index  = $(this).parent().data("index");

		audio.loadFile("audio/" + romaji[index] + ".wav", romaji[index], function(url, id) {
			console.log(url + " loaded");
			audio.stop(id);
			audio.play(id);
		});
	});
	$("#gen-new-letter").click(function() {
		genNewLetters();
	});
	$("#compare-letter").click(function() {
		for(var i=0; i<canvasList.length; i++) {
			canvasList[i].drawAll();
		}
	});
	$("#reset-letter").click(function() {
		for(var i=0; i<canvasList.length; i++) {
			canvasList[i].reset(false);
		}
	});
	table.gen("#table", "table-cell inactive", 6, 17, function(row, col) {
		if(row == 0 && col == 0) {
			return "";
		}
		else if(row == 0) {
			return top[col-1];
		}
		else if(col == 0) {
			return left[row-1];
		}
		return hiragana[(row-1)*5 + (col-1)];
	});

	$("#user-input").keydown(function(e) {
		if(e.keyCode == 13) {
			var result = game.processUserInput($("#user-input").val(), "a");
			game.genStatistics("#statistics");

			$("#letter").css("font-family", result.font);
			$("#letter").text(result.display);
			$("#timer").text(result.time + " " + result.font);
			$("#user-input").val(result.input);
			$("#user-input").focus();
		}
	});
	$(".table-cell").click(function() {
		var table     = $("#table");
		var row       = $(this).parent().index();
		var col       = $(this).index();

		function toggleCell(e, r, c) {
			var value = false;

			if(e.hasClass("active")) {
				e.removeClass("active");
				e.addClass("inactive");
				value = false;
			}
			else if(e.hasClass("inactive")) {
				e.removeClass("inactive");
				e.addClass("active");
				value = true;
			}
			if(r > 0 && c > 0) {
				whitelist[(r-1)*5 + (c-1)] = value;
			}
		}
		if(row == 0 && col == 0) {
			table.children().each(function(r, element) {
                $(element).children().each(function(c, e) {
                    toggleCell($(e), r, c);
                });
            });
		}
		if(row == 0) {
			table.children().each(function(r, element) {
                $(element).children(":eq("+col+")").each(function(c, e) {
                    toggleCell($(e), r, col);
                });
            });
		}
		if(col == 0) {
			table.children(":eq("+row+")").children().each(function(c, element) {
				toggleCell($(element), row, c);
            });
		}
		else {
			toggleCell($(this), row, col);
		}
		game.whitelistLetters(whitelist);
		game.genStatistics("#statistics");
	});
	$("#toggle-preferences").click(function() {
		if($("#preferences").css("display") === "none") {
			$("#preferences").css("display", "block");
		}
		else {
			$("#preferences").css("display", "none");
		}
	});
});
