/* 
The characters are as follows:
1: one
2: two
3: three
4: four

Stats will be defined as follows:
ap = 'attack power'
hp = 'health points'
dp = 'counter attack power (ie: defence power)'

Other names:
pc = player character
ec = enemy character
*/

var pc; // Will be the object chosen as the player character
const ecs = []; // List of all objects chose to be enemy characters
const deadNames = []; // List of value of .name for all dead characters

// Value of 'class' atribute for the character html elments before being designated 'pc' or 'ec'
const defualtAttributes = $('.char').attr('class'); 

// Default stat values - If these values need to be changed, change them here only as everything else pulls from these values.
// Format [HP,AP,DP]
const dSV = {'one':[150,25,50], 'two':[500,5,15], 'three':[100,15,75], 'four':[75,50,150]};

// Action button
// Starts out as select button and will be re-used as all other buttons throughout the game
var actionButton = {
    // jQuery element object
    element: $('#action-button'),

    // Set button text
    label: function(text) {this.element.innerHTML = text;}, 

    // Shadows jQuery.val() on this.element
    val: function (newVal) {
        if (newVal) {
            this.element.val(newVal);
        } else {
            return this.element.val();
        };
    },
};


// Playable character object
class Character {
    constructor(hp, ap, dp, name) {
        this.name = name; // name of the character -- Should be equal to element id
        this.hp = hp; // Health
        this.ap = ap; // Attack power
        this.dp = dp; // Defence power (aka: counter-attack power)
        this.element = $(`#${name}`); // Grabs the html tag that this 
        this.class = defualtAttributes.split(' '); // List of classes contained in the html element's 'class' attribute
        this.makePC = function () { pc = this; this.mkClass('pc');}; // Adds this object as the 'pc' ie: player character
        this.makeEC = function () { ecs.push(this); this.mkClass('ec');}; // Adss this object to the list of 'ec's ie: enemy characters
        
        this.reInitialize = function () { // Resets object to default values. dSV is an object containing default values indexed to the object name
            this.hp = dSV[this.name][0];
            this.ap = dSV[this.name][1];
            this.dp = dSV[this.name][2];
            this.element.attr('class', defualtAttributes);
            this.class = defualtAttributes.split(' ');
        };

        this.mkClass = function (newClass) { // Adds a class to the 'class' attribute of the html element
            this.class = this.element.attr('class').split(' ');
            if (!(this.class.includes(newClass))) {
                this.class.push(newClass);
                this.element.attr('class', this.class.join(' '));
            };
        };

        this.rmClass = function (oldClass) { // Removes an existing class from the class attribute of the html element while preserving the rest of the classes
            this.class = this.element.attr('class').split(' ');
            if (this.class.includes(oldClass)) {
                let rmIndex = this.class.indexOf(oldClass);
                if (rmIndex > -1) {
                    this.class.splice(rmIndex,1);
                    this.element.attr('class', this.class.join(' '));
                };
            };
        };

        this.updateReadout = function() { // Displays the current values for hp, ap, dp, etc.
            this.element.find('#ap').html(`AP: ${this.ap}`);
            this.element.find('#dp').html(`DP: ${this.dp}`);
            this.element.find('#hp').html(`HP: ${this.hp}`);
        };

        this.element.click(function () { actionButton.val($(this).val()); }); // Adds a click handler that sets the value for action button to this elements's value
    }
};

// Instantiating the four playable characters based off of the above default values
var one = new Character(dSV['one'][0], dSV['one'][1], dSV['one'][2], 'one'); // DPS
var two = new Character(dSV['two'][0], dSV['two'][1], dSV['two'][2], 'two'); // Tank
var three = new Character(dSV['three'][0], dSV['three'][1], dSV['three'][2], 'three'); // Rogue
var four = new Character(dSV['four'][0], dSV['four'][1], dSV['four'][2], 'four'); // Mage

const allChars = [one, two, three, four]; // list for easy selection of all characters

// Main logic handler for the game that will orchestrate all the other objects and have a method called on it to advance the action
const mainLoop = {
    // Modes: 'charSelect', 'enemySelect', 'attack', 'end'
    mode: 'charSelect',

    opponent: undefined,
    // This method will be attached to a click event for the actionButton. It will have the value of the button passed in to the 'value' argument
    action: function(value) {

        // What we do with this info will depend on what mode we're in
        switch(this.mode) {
            case 'charSelect':

                // if the case is character select then we need to use another switch to see which character we're selecting as the pc.
                switch(value) {
                    case 'one': one.makePC(); break;
                    case 'two': two.makePC(); break;
                    case 'three': three.makePC(); break;
                    case 'four': four.makePC(); break;
                };

                // After making one of our characters into the 'pc', we'll add all remaining characters to the list of 'ec's
                for (i in allChars) {
                    if (!(allChars[i] === pc)) {
                        allChars[i].makeEC();
                    };
                };
                
                // Then we want to change modes so we don't get any funky behavior from the user selecting more than one pc
                this.mode = 'enemySelect'

                // Now we need to move the pc to top row
                pc.element.detach();
                $('#row-top').append(pc.element);

                // And change title text to promp the user to select an enemy. 'Select' still works for the button text, but we'll make it explicit just in case.
                $('#title').html('Choose your first opponent!');
                actionButton.element.html('Select');

                break;

            case 'enemySelect':
                // Now basically do the same thing over again to select an enemy to fight, except we make sure the user can't select themselves to fight.
                switch(value) {
                    case 'one': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = one; one.mkClass('opp');}; break;
                    case 'two': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = two; two.mkClass('opp');}; break;
                    case 'three': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = three; three.mkClass('opp');}; break;
                    case 'four': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = four; four.mkClass('opp');}; break;
                };

                console.log(`DEBUG: this.opponent = ${this.opponent}`);

                if (this.opponent === undefined) {break;}; // If no valid section was made, do nothing.

                // Then switch to attack mode
                $('#title').html('FIGHT!');
                actionButton.element.html('Attack!');
                this.mode = 'attack';
                break;

            case 'attack':
                // Decrement hit points
                this.opponent.hp -= pc.ap;
                pc.hp -= this.opponent.dp;

                // Increment pc's ap
                pc.ap += dSV[pc.name][1] 

                // Refresh values on screen
                pc.updateReadout();
                this.opponent.updateReadout();

                // Check for deaths
                if (pc.hp < 1) {
                    // Game over
                    $('#title').html('G A M E &nbsp;&nbsp; O V E R');
                    $('#row-bot').html('<br> <br>');
                    actionButton.element.html('New Game');
                    this.mode = 'end';
                } else if (this.opponent.hp < 1 && ecs === []) {
                    // Win!
                    $('#title').html('Y O U &nbsp;&nbsp; W I N');
                    $('#row-bot').html('<br> <br>');
                    actionButton.element.html('New Game');
                    this.mode = 'end';
                } else if (this.opponent.hp < 1) {
                    // Win round. Remove enemy. 
                    this.opponent.element.detach(); // Remove dead ec from html
                    ecs.splice(ecs.indexOf(this.opponent),1); // Remove dead character from list of ecs
                    deadNames.push(this.opponent.name); // Add name to list of the dead
                    this.opponent = undefined; // Reset this.opponent
                    // Reset to pick new enemy
                    this.mode = 'enemySelect' // Change mode back to enemy select
                    // Reset page back to enemy select:
                    $('#title').html('Select another opponent!');
                    actionButton.element.html('Select');
                };
                break;
            
            case 'end':
                // Reset game
                this.mode = 'charSelect';
                pc = undefined;
                for (e in ecs) {
                    ecs.pop();
                };
                for (d in deadNames) {
                    deadNames.pop();
                };
                this.opponent = undefined;
                for (c in allChars) {
                    allChars[c].reInitialize();
                    allChars[c].element.detach();
                    $('#row-mid').append(allChars[c].element);
                    allChars[c].updateReadout();
                };
                actionButton.element.html('Select');
                $('#title').html('Choose your fighter!');
            
                break;

        };
    },

};

// Wait until page is loaded fully, then execute:
window.onload = function() {

    // Update all characters with thier values for ap, dp, hp
    for (c in allChars) {
        allChars[c].updateReadout();
    };

    // Created click handler for main button
    actionButton.element.click(
        function () {
            mainLoop.action($(this).val());
        }
    );
};
