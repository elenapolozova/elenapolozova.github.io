// final plan: 3.5 main features
// (need internet to progress further) 1: tooltip for every article
// 2: "click two articles to display their similarity" roaming tooltip
//      --> and maybe list up to 3 overlapping subjects, when clicking inside the box! 
// 3: hover capabilities! highlight others from same location, 
//    and, (press some button on side to toggle)
//    hover-to-highlight-most-similar (so, hover over an article and other articles
//    take on its color (vs. grey) with intensity proportional to their similarity)
//    potential concern: this could be hard to read for some colors. might have to make it 1-color



// TODOO:
// --> need a country key!
// oo maybe let you highlight by topic? but...nah
// --> dotted line the article info box! Or dash? Something...
// make excerpt display nicely under title: fix the spacing!!!

// DO WHEN HAVE INTERNET:
// --> textbounds to make box nice shape
// --> EXPAND NUMBER OF ARTICLES! CRUCIAL! 


// known issues: 
// --> hovering control flow is misnamed but still works, at least
// --> ok dots overflow bounding box, that shouldn't happen y is that


// information read from files
var tsneCoords; // the global variables
var countryIDs; // one id per article
var titles; // one title per article
var cosSimMat;
var titlesFormatted; // one title per article, with "!!" where line breaks will be necessary for display
var excerptsFormatted;
var excerpts;
var commonInfo;
var regionKey;
var dates;

var mapLeft = 50;
var mapUpper = 50;
var mapWidth = 600;
var mapHeight = 350;
var dotSize = 10;
var countryColors;

// these are to map the tsne coords onto our screen size
var tsneXmin = 0;
var tsneXmax = 0;
var tsneYmin = 0;
var tsneYmax = 0;

// data management variables
var articleNodes; 
var keyNodes;
var articleTooltip;
var lastTwoNodesClicked; // enable the "similarity" tooltip to come up
var similarityTooltip;
var unfoldSimilarity;
var key; // region key
var sideText;

// interaction variables
var hoveredInLastFrame = false; 
var unfoldedOnce = false;

function setup() {
  createCanvas(1100, 700); // size subject to change
  tsneCoords = tsneCoords.getArray();
  countryIDs = countryIDs.getArray();
  titles = titles.getArray();
  cosSimMat = cosSimMat.getArray();
  excerpts = excerpts.getArray();
  regionKey = regionKey.getArray();
  dates = dates.getArray();
  commonInfo = commonInfo.getArray();

  
  // enough colors for our 16 regions
  countryColors = [color(31,120,180), color(178,120,180),
      color(51,160,44),color(251,154,153),color(227,26,28),
      color(253,191,111), color(255,127,0), color(166,206,227), color(202,178,214),
      color(106,61,153),color(221,28,119),color(240,59,32),
      color(35,139,69),color(129,15,124),color(240,240,240),color(237,248,117)];
      

  // find min and max tsne coords, to map the box accurately
  for (r = 0; r < tsneCoords.length; r++){
    // cast to float so everything works
    tsneCoords[r][0] = parseFloat(tsneCoords[r][0]);
    tsneCoords[r][1] = parseFloat(tsneCoords[r][1]);
    if (tsneCoords[r][0] < tsneXmin){
      tsneXmin = tsneCoords[r][0];
    }
    if (tsneCoords[r][0] > tsneXmax){
      tsneXmax = tsneCoords[r][0];
    }
    if (tsneCoords[r][1] < tsneYmin){
      tsneYmin = tsneCoords[r][1];
    }
    if (tsneCoords[r][0] > tsneYmax){
      tsneYmax = tsneCoords[r][1];
    }
  }
  
  articleNodes = Array(tsneCoords.length); // initialize
  for (a = 0; a < articleNodes.length; a++){
    mappedX = map(tsneCoords[a][0], tsneXmin, tsneXmax, mapLeft, mapLeft+mapWidth);
    mappedY = map(tsneCoords[a][1], tsneYmin, tsneYmax, mapUpper, mapUpper+mapHeight);
    countryID = parseInt(countryIDs[a]);
    //print(a + "  " + countryID + " " + excerpts[a])
    articleNodes[a] = new ArticleNode(a, mappedX, mappedY, dotSize, dotSize, countryID, titles[a], excerpts[a], countryColors[countryID], 230, dates[a]) // IN PROGRESS RIGHT NOW
  }
  
  articleTooltip = new ArticleTooltip(10, 10, "", 0, "", ""); // throwaway, just here to instantiate
  articleTooltip.hide();
  similarityTooltip = new SimilarityTooltip(0,0,0,0,0,0); // fake variables bc won't be shown
  similarityTooltip.hide();
  unfoldSimilarity = false;
  
  lastTwoNodesClicked = [];
  
  key = new RegionKey(50, 550);
  sideText = new SideText(width - 350, 225);
}

function draw() {
  background(255);
  frameRate(5);
  
  //title
  push();
  var titleLeft = width - 350;
  var titleTop = 70;
  stroke(100);
  fill(100);
  textSize(29);
  textFont(latoLight);
  text("explore the news in", titleLeft, titleTop);
  textFont(ralewayReg);
  textSize(80);
  text("TOPIC", titleLeft, titleTop + 70);
  textSize(72);
  text("SPACE", titleLeft, titleTop + 135);
  pop();
  
  fill(100);
  for (a = 0; a < articleNodes.length; a++){
    articleNodes[a].display();
  }
  
  key.display(); // do it now so that hover effects go *over* the key
  sideText.display();
  
  // calibration of map size
  //noFill();
  //stroke(100);
  //rect(mapLeft, mapUpper, mapWidth, mapHeight);
  
  // do hover effects
  // "if we started hovering over something"
  hovering = false;
  for (a = 0; a < articleNodes.length; a++){
    if (articleNodes[a].containsCursor()){
      hovering = true;
      if (!hoveredInLastFrame){ // only update if need to
        for (b = 0; b < articleNodes.length; b++){
          //print("id b " + parseInt(countryIDs[b]) + " id a " + parseInt(countryIDs[a]));
          if (parseInt(countryIDs[b]) != parseInt(countryIDs[a])){ 
            articleNodes[b].unhover();
          }
        }
        articleNodes[a].hover();
      }// end if
    }
  } // end for over articlenodes
  for (r = 0; r < regionKey.length; r++){
    if (keyNodes[r].containsCursor()){
      hovering = true;
      if (!hoveredInLastFrame){ // only update if need to
        for (b = 0; b < articleNodes.length; b++){
          //print("id b " + parseInt(countryIDs[b]) + " id a " + parseInt(countryIDs[a]));
          if (parseInt(countryIDs[b]) != r){ 
            articleNodes[b].unhover();
          }
        }
        //articleNodes[a].hover();
      }// end if
    }
  } // end for over keynodes
  
  
  // if we unhovered, reemphasize entire graph
  if (!hovering && hoveredInLastFrame){
    for (a = 0; a < articleNodes.length; a++){
      articleNodes[a].hover();
      articleTooltip.hide();
    } // end for
  } // end if
  hoveredInLastFrame = hovering; // end hover effects
  
  // deal w tooltips now
  similarityTooltip.display();
  articleTooltip.display();
  
  // activate similarityTooltip if the right clicks have happened
  if (lastTwoNodesClicked.length == 2){ // if two have been clicked
    if (lastTwoNodesClicked[0].nodeID != lastTwoNodesClicked[1]){ // defend against that one case
      // now we safely display
      node1 = lastTwoNodesClicked[0];
      node2 = lastTwoNodesClicked[1];
      similarityTooltip = new SimilarityTooltip(node1.x, node1.y, node1.nodeID, node2.x, node2.y, node2.nodeID);
      similarityTooltip.show();
    } // end if
  } // end if
  else {
    similarityTooltip.hide(); // hide it if the length isn't appropriate
  }
  
} // end draw

function preload(){
  tsneCoords = loadTable('supportingData1/tsnecoords.tsv', 'tsv');
  countryIDs = loadTable('supportingData1/regionIDsCNN.tsv', 'tsv');
  titles = loadTable('supportingData1/titlesCNN.tsv', 'tsv');
  cosSimMat = loadTable('supportingData1/cossimmatCNN.tsv', 'tsv');
  titles = loadTable('supportingData1/titlesCNN.tsv', 'tsv');
  excerpts = loadTable('supportingData1/excerptsCNNellipses.tsv', 'tsv');
  regionKey = loadTable('supportingData1/regionKey.tsv', 'tsv');
  dates = loadTable('supportingData1/datesCNN.tsv', 'tsv');
  commonInfo = loadTable('supportingData1/commoninfo.tsv', 'tsv');
  
  loraReg = loadFont("assets/Lora-Regular.ttf");
  loraBold = loadFont("assets/Lora-Bold.ttf");
  openSansReg = loadFont("assets/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/OpenSans-Bold.ttf");
  openSansItalic = loadFont("assets/OpenSans-Italic.ttf");
  ralewayReg = loadFont("assets/RalewayDots-Regular.ttf");
  latoLight = loadFont("assets/Lato-Hairline.ttf")
  cormorantReg = loadFont("assets/CormorantGaramond-Regular.ttf");
  
}

mouseClicked = function(){
  // if we clicked on a node, add it to the lastTwoNodesClicked queue
  for (a = 0; a < articleNodes.length; a++){

    if (articleNodes[a].containsCursor()){
      // maintain "last two clicked" data structure
      var numQueued = lastTwoNodesClicked.length;
      var addOrRemove = true;
      var offendingInd = -1;
      if (numQueued > 0){ // if more than 0 queued, only push if this node isn't already there
        for (i = 0; i < numQueued; i++){
          if (lastTwoNodesClicked[i].nodeID == articleNodes[a].nodeID){
            addOrRemove = false; // if it's already there, REMOVE it
            offendingInd = i;
          } // end if
        } // end for
      } // end if
      
      if (addOrRemove){ // if we wound up adding
        lastTwoNodesClicked.push(articleNodes[a]);
      }
      
      else{ // removal time
        var newLastTwoNodes = [];
        for (i = 0; i < numQueued; i++){
          if (i != offendingInd){
            newLastTwoNodes.push(lastTwoNodesClicked[i]); // only re-add if it didn't just get re-clicked
          } // end if
        } // end for
        lastTwoNodesClicked = newLastTwoNodes;
      }
      // k reimplementing a data structure since I don't have wifi right now
      // maintenence: keep only the last two
      if (lastTwoNodesClicked.length > 2){
        var newLastTwoNodes = [];
        for (i = 1; i < lastTwoNodesClicked.length; i++){
          newLastTwoNodes.push(lastTwoNodesClicked[i]); // only re-add if it didn't just get re-clicked
        }// end for
        lastTwoNodesClicked = newLastTwoNodes;
      } // end if

      //print("length of lastTwoNodesClicked = " + lastTwoNodesClicked.length);
    } // end if
  } // end for
    //for (i = 0; i < lastTwoNodesClicked.length; i++){
      //print(lastTwoNodesClicked[i].nodeID);
    //}
    
  if (similarityTooltip.containsCursor()){
    unfoldSimilarity = !unfoldSimilarity;
  }
}

// ------------------------------ //
// ------OBJECT DEFINITIONS------ //
// ------------------------------ //
// contains all the relevant information necessary to display an article. 
function ArticleNode(nodeID, x, y, w, h, countryID, titleString, excerptString, hoverColor, unhoverColor, dateString){
  // making the parameters belong to the specific button object
  this.nodeID = nodeID;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.countryID = countryID; // it's now redundant to pass in the colors; fix later
  this.hoverColor = hoverColor;
  this.unhoverColor = unhoverColor;
  this.currentColor = hoverColor; // initialize
  this.dateString = dateString;
  
  // tooltip vars
  this.isSimFlagged = false; // if is currently being scrutinized for similarity to another article
  this.titleString = titleString;
  this.excerptString = excerptString;
  
  this.display = function(){
    push();
    stroke(0);
    
    stroke(this.currentColor);
    fill(this.currentColor);
    ellipse(this.x, this.y, this.w, this.h);
    
    // draw a bigger circle around
    if (this.isSimFlagged){
      stroke(100);
      noFill();
      ellipse(this.x, this.y, this.w*2, this.h*2);
    }
    
    // if the tooltip is up, draw the tooltip
    pop();
  }

  // only called when something else is hovered over
  // might wanna look into writing a function called "unhover" instead, or something
  this.unhover = function(){
    this.currentColor = this.unhoverColor;
    articleTooltip.hide();
  }
  
  // will be called whenever a user is hovering over this point
  this.hover = function(){
    this.currentColor = this.hoverColor;
    articleTooltip = new ArticleTooltip(this.x, this.y, this.titleString, this.excerptString, this.countryID, this.dateString);
    articleTooltip.show();
  }
  
  this.simFlag = function(){
    this.isSimFlagged = true;
  }
  
  this.unSimFlag = function(){
    this.isSimFlagged = false;
  }
  
  // okay this is for a rect rn but I just wanted it to run, fix later
  this.containsCursor = function() {
    return (mouseX > x - w/2 && mouseX < x + w/2 + w && y - h/2 < mouseY && mouseY < y + h/2);
  }

}

// taps into the region-hovering capability of articlenode, but does nothing else
function KeyNode(x, y, w, h, countryID, hoverColor, unhoverColor){
  // making the parameters belong to the specific button object
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.countryID = countryID; // it's now redundant to pass in the colors; fix later
  this.hoverColor = hoverColor;
  this.unhoverColor = unhoverColor;
  this.currentColor = hoverColor; // initialize

  
  this.display = function(){
    push();
    stroke(0);
    
    stroke(this.currentColor);
    fill(this.currentColor);
    ellipse(this.x, this.y, this.w, this.h);

    pop();
  }

  // only called when something else is hovered over
  // might wanna look into writing a function called "unhover" instead, or something
  this.unhover = function(){
    this.currentColor = this.unhoverColor;
    articleTooltip.hide();
  }
  
  // will be called whenever a user is hovering over this point
  this.hover = function(){
    this.currentColor = this.hoverColor;
    articleTooltip = new ArticleTooltip(this.x, this.y, this.titleString, this.excerptString, this.countryID, this.dateString);
    articleTooltip.show();
  }
  
  // okay this is for a rect rn but I just wanted it to run, fix later
  this.containsCursor = function() {
    return (mouseX > x - w/2 && mouseX < x + w/2 + w && y - h/2 < mouseY && mouseY < y + h/2);
  }

}


// contains all the relevant information necessary to display an article. 
// x, y are tooltip center
function ArticleTooltip(x, y, titleString, excerptString, location, dateString){
  this.x = x;
  this.y = y;
  this.location = location;
  this.titleString = titleString;
  this.excerptString = excerptString;
  this.dateString = dateString;
  
  // adjustable parameters for all tooltips
  this.w = 220;
  this.h = 200;
  this.c = color(250, 250, 250, 210); // should be semitransparent
  this.strokec = countryColors[location];
  this.textc = color(100); // text color
  this.spacingBelowArticle = 40;
  
  // internal bookkeeping variables
  this.isVisible = false;
  
  this.display = function(){
    if (this.isVisible){ // only display if a hover is taking place
      push();
      stroke(0);
    
      stroke(this.strokec);
      fill(this.c);

      rect(this.x, this.y, this.w, this.h);
      noStroke();
      // title
      fill(this.textc);
      textSize(16);
      textFont(openSansBold)
      textAlign(LEFT, TOP);
      text(this.titleString, this.x + 10, this.y, 200, 400);
      
      // date and excerpt
      var approxNumTitleLines = String(titleString).length / 30
      var lastTitleY = this.y + approxNumTitleLines * 18;
      var dateY = lastTitleY + this.spacingBelowArticle;
      textSize(10);
      textFont(openSansReg);
      text(this.dateString, this.x + 10, dateY, 200, 100);
      var excerptY = lastTitleY + 1.5*this.spacingBelowArticle;
      textSize(12);
      textFont(openSansItalic)
      textAlign(LEFT, TOP);
      text(this.excerptString[0], this.x + 10, excerptY, 200, 300);

      pop();
    }
  }
  
  this.hide = function(){
    this.isVisible = false;
  }
  
  this.show = function(){
    this.isVisible = true;
  }
}
  
// contains all the relevant information necessary to display an article. 
function SimilarityTooltip(x1, y1, id1, x2, y2, id2){
  this.x1 = x1;
  this.x2 = x2;
  this.y1 = y1;
  this.y2 = y2;
  this.x = (this.x1 + this.x2)/2
  this.y = (this.y1 + this.y2)/2
  this.id1 = id1;
  this.id2 = id2;
  
  // adjustable parameters for this class of tooltips
  this.w = 210;
  this.h = 50;
  this.c = color(250, 250, 250, 210); // should be semitransparent
  this.strokec = color(200);
  this.textc = color(100); // text color
  
  // internal bookkeeping variables
  this.isVisible = false;
  this.displayCommonInfo = false;
  this.commonInfoString = String(commonInfo[this.id1][this.id2]);
  
  // clear all simFlags, then re-flag the appropriate ones
  for (var a = 0; a < articleNodes.length; a++){
    articleNodes[a].unSimFlag();
  }
  articleNodes[this.id1].simFlag();
  articleNodes[this.id2].simFlag();
  
  this.display = function(){
    
    if (this.isVisible){ // only display if it should be displayed
      
      push();
      stroke(this.strokec);
      fill(this.c);

      rect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
      noStroke();
      // title
      fill(this.textc);
      textSize(12);
      textFont(openSansReg)
      textAlign(CENTER, BOTTOM);
      text("These articles have a\ncosine similarity of", this.x - 38, this.y);
      textSize(34);
      text(nf(cosSimMat[this.id1][this.id2], 1, 2), this.x + 62, this.y + 22);
      textSize(8);
      fill(color(150));
      if (!unfoldedOnce){ // only display hint if they haven't taken it yet
        text("(click to unfold)", this.x + 62, this.y + 25);
      }
      
      if (unfoldSimilarity){
        stroke(this.strokec);
        fill(this.c);
        var approxNumLines = this.commonInfoString.length*1.0/30
        rect(this.x - this.w/2, this.y + this.h/2 + 10, this.w, approxNumLines*18 + 15);
        var listX = this.x - this.w/2 + 10;
        var listY = this.y + this.h/2 + 15;
        textSize(12);
        noStroke();
        fill(100);
        textFont(openSansReg)
        textAlign(LEFT, TOP);
        text(this.commonInfoString, listX, listY, this.w - 20, 600);
        unfoldedOnce = true;
      }
      
      pop();
    }
  }
  
  this.hide = function(){
    this.isVisible = false;
    articleNodes[this.id1].unSimFlag();
    articleNodes[this.id2].unSimFlag();
  }
  
  this.show = function(){
    this.isVisible = true;
  }
  
  // okay this is for a rect rn but I just wanted it to run, fix later
  this.containsCursor = function() {
    return (mouseX > this.x - this.w/2 && mouseX < this.x + this.w/2 + 
      this.w && this.y - this.h/2 < mouseY && mouseY < this.y + this.h/2);
  }

}

// region key object!
function RegionKey(leftX, topY){
  this.leftX = leftX;
  this.topY = topY;
  
  // adjustable shape parameters
  this.w = 210;
  this.h = 50;
  this.lineSpacing = 20;
  this.colSpacing = 200;

  this.strokec = color(200);
  this.textc = color(100); // text color
  
  keyNodes = Array(regionKey.length); // initialize

  this.display = function(){
    fillInKeyNodes = (typeof keyNodes[0] === 'undefined');
    print(fillInKeyNodes)
    push();
    var textY = this.topY;
    noStroke();
    fill(0);
    textAlign(LEFT, CENTER);
    textFont(openSansReg);
    textSize(10);
    for (var c = 0; c < regionKey.length; c++){
      var col = int(c/4);
      var row = c % 4;
      var entryX = this.leftX + col*this.colSpacing;
      if (col == 1){
        entryX = entryX - 15;
      }
      if (col == 2){
        entryX = entryX - 10;
      }
      if (col == 3){
        entryX = entryX - 20;
      }
      var entryY = topY + row*this.lineSpacing;
      push();
      fill(countryColors[c]);
      if (fillInKeyNodes){
        keyNodes[c] = new KeyNode(entryX - 10, entryY, dotSize, dotSize, c, countryColors[c], 230);
        print(keyNodes[c])
        
      }
      keyNodes[c].display();
      //ellipse(entryX - 10, entryY, dotSize, dotSize);
      pop();
      text(regionKey[c], entryX, entryY)
    }
    textSize(9);
    noStroke();
    fill(150);
    text("(hover over a key node to highlight its region)", this.leftX - 15, this.topY + 80);
    pop();
  }
}// end RegionKey

function SideText(leftX, topY){
    
    this.w = 300;
    this.h = 600;
    
    this.display = function(){
    push();
    noStroke();
    fill(100);
    textAlign(LEFT, TOP);
    textFont(loraReg);
    textSize(12);
    var firstLine = "When we index a news article, we're performing a sort of 'translation': we're re-expressing the raw text as a vector in a high-dimensional vector space.";
    text(firstLine, leftX, topY, 300, 600);
    var secondLine = "What does the distribution of news articles in this space look like? How do we begin to understand the clusters, the outliers, the overall contour of the article landscape?"
    text(secondLine, leftX, topY + 58, 300, 600);
    var thirdLine = "At right, we've applied two common techniques for making sense of high-dimensional data."
    text(thirdLine, leftX, topY + 133, 300, 600);
    textFont(loraBold);
    var fourthLine = "Each point represents an article in our search database.";
    text(fourthLine, leftX, topY + 173, 300, 600);
    textFont(loraReg)
    var fifthLine1 = "Using";
    text(fifthLine1, leftX, topY + 212, 300, 600);
    textFont(loraBold);
    var fifthLine2 = "t-SNE (t-Distributed Stochastic Neighbor"
    text(fifthLine2, leftX + 36, topY + 211, 300, 600);
    var fifthLine3 = "Embedding)";
    text(fifthLine3, leftX, topY + 227, 300, 600);
    textFont(loraReg);
    var fifthLine4 = ", we've reduced the dimensionality of"
    text(fifthLine4, leftX + 70, topY + 227, 300, 600);
    var fifthLine5 = "our article representations from 392—the number of topics considered by our search engine—to two, and plotted the results in 2-d space.";
    text(fifthLine5, leftX, topY + 243, 300, 600);
    var sixthLine1 = "t-SNE was designed to preserve nearest-neighbor relationships: "
    text(sixthLine1, leftX, topY + 300, 300, 600);
    var sixthLine2 = "try mousing over nearby articles";
    textFont(loraBold);
    text(sixthLine2, leftX + 78, topY + 314, 300, 600);
    textFont(loraReg);
    var sixthLine3 = "to see if they sound similar!";
    text(sixthLine3, leftX, topY + 329, 300, 600);
    var seventhLine1 = "Additionally,";
    text(seventhLine1, leftX, topY + 360, 300, 600);
    textFont(loraBold);
    var seventhLine2 = "clicking on the points will reveal their";
    text(seventhLine2, leftX + 73, topY + 359);
    var seventhLine3 = "cosine similarity"
    text(seventhLine3, leftX, topY + 374);
    textFont(loraReg);
    var seventhLine4 = ", a metric that increases with the"
    text(seventhLine4, leftX + 96, topY + 375, 300, 600);
    var seventhLine5 = "parallelism of their vector representations.";
    text(seventhLine5, leftX, topY + 389);
    
    pop();
    } // end display
}// end sidetext
