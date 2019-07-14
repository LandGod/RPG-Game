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
dSV = default stat values
*/

var pc; // Will be the object chosen as the player character
var ecs = []; // List of all objects chose to be enemy characters
var deadNames = []; // List of value of .name for all dead characters

// Value of 'class' atribute for the character html elments before being designated 'pc' or 'ec'
const defualtAttributes = $('.char').attr('class'); 

// Default stat values - If these values need to be changed, change them here only as everything else pulls from these values.
// Format: {'object.name' : [HP,AP,DP]}
const dSV = {'one':[150,25,25], 'two':[500,10,10], 'three':[100,15,55], 'four':[75,50,75]};

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
        this.element = $(`#${name}`); // Grabs the html tag which represents this object on the webpage
        this.class = defualtAttributes.split(' '); // List of classes contained in the html element's 'class' attribute
        this.makePC = function () { pc = this; this.mkClass('pc');}; // Adds this object as the 'pc' ie: player character
        this.makeEC = function () { ecs.push(this); this.mkClass('ec');}; // Adss this object to the list of 'ec's ie: enemy characters
        
        // Resets object to default values. dSV is an object containing default values indexed to the object name
        // dSV format: {'object.name' : [HP, AP, DP]}
        this.reInitialize = function () { 
            this.hp = dSV[this.name][0];
            this.ap = dSV[this.name][1];
            this.dp = dSV[this.name][2];
            this.element.attr('class', defualtAttributes);
            this.class = defualtAttributes.split(' ');
        };

        // Adds a class to the 'class' attribute of the html element
        this.mkClass = function (newClass) { 
            this.class = this.element.attr('class').split(' ');
            if (!(this.class.includes(newClass))) {
                this.class.push(newClass);
                this.element.attr('class', this.class.join(' '));
            };
        };

        // Removes an existing class from the class attribute of the html element while preserving the rest of the classes
        this.rmClass = function (oldClass) { 
            this.class = this.element.attr('class').split(' ');
            if (this.class.includes(oldClass)) {
                let rmIndex = this.class.indexOf(oldClass);
                if (rmIndex > -1) {
                    this.class.splice(rmIndex,1);
                    this.element.attr('class', this.class.join(' '));
                };
            };
        };

        // Displays the current values for hp, ap, dp, etc.
        this.updateReadout = function() { 
            this.element.find('#ap').html(`AP: ${this.ap}`);
            this.element.find('#dp').html(`DP: ${this.dp}`);
            this.element.find('#hp').html(`HP: ${this.hp}`);
        };

        // Adds a click handler that sets the value for action button to this elements's value
        this.element.click(function () { actionButton.val($(this).val()); }); 
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

    // Stores the ec object which is currently being fought by the pc
    opponent: undefined,

    // This method will be attached to a click event for the actionButton. It will have the value of the button passed in to the 'value' argument
    action: function(value) {

        // What we do with this info will depend on what mode we're in
        switch(this.mode) {

            // The characer select mode is the starting mode. When the actionButton is clicked in this mode
            // whichever character was selected by the user should me made into the player characer
            // while all other characters should be made into enemy characters
            case 'charSelect':

                // Call the 'makePC' method on whichever character the user chose
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
                
                // Then we want to change modes so our next user selection can be handled as selecting an enemy to fight
                this.mode = 'enemySelect'

                // Now we need to move the pc to top row
                pc.element.detach();
                $('#row-top').append(pc.element);

                // And change title text to promp the user to select an enemy. 
                // 'Select' still works for the button text, but we'll make it explicit just in case.
                $('#title').html('Choose your first opponent!');
                actionButton.element.html('Select');

                break;

            // Enemy select is very similar to character select,
            // except that we have to check that the selection is neither the player or an already dead enemy.
            // This selection will be saved in this.opponent so we always no who the current enemy we're fighting is
            case 'enemySelect':

                // The value will be the value of .name for whichever character was last clicked before the action button was clicked
                // There are only four valid character names, but each valid name must be further checked to avoid two error cases:
                // 1) PC cannot fight themeselves and 2) PC cannot fight an EC they've already killed.
                switch(value) {
                    case 'one': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = one; one.mkClass('opp');}; break;
                    case 'two': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = two; two.mkClass('opp');}; break;
                    case 'three': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = three; three.mkClass('opp');}; break;
                    case 'four': if(!(value === pc.name) && !deadNames.includes(value)){this.opponent = four; four.mkClass('opp');}; break;
                };

                // If no valid section was made, do nothing.
                if (this.opponent === undefined) {break;}; 

                // If a valid selection was made, then switch to attack mode
                // and update title and button text accordingly
                $('#title').html('FIGHT!');
                actionButton.element.html('Attack!');
                this.mode = 'attack';

                break;
            

            // The attack case does the same thing over and over again until either the pc or current opponent ec has less than 1 hp.
            // Every attack round: 
                // the pc loses hp equal to the opponent's dp
                // the opponent loses hp equal to the pc's curret ap
                // AFTER those two things happen, the pc's ap is incremented by its default value.
            // As the game can be won or lost during an attack round we must also check for and handle 'win' and 'loss' conditions here
            case 'attack':

                // Decrement hit points
                this.opponent.hp -= pc.ap;
                pc.hp -= this.opponent.dp;

                // Increment pc's ap
                pc.ap += dSV[pc.name][1] 

                // Refresh values on screen
                pc.updateReadout();
                this.opponent.updateReadout();

                // Check player death
                // Note that since we do this before checking for opponent death, if the player dies at the same time as thier
                // last opponent, we still count that as a loss. This is the intended behavior. 
                if (pc.hp < 1) {

                    // Game over
                    pc.mkClass('dead'); // Display pc as dead
                    $('#title').html('G A M E &nbsp;&nbsp; O V E R'); // Change title

                    // It's important to add some blank lines above the actionButton to push it down the page
                    // This prevents a user who is mashing 'attack' from restarting the game before they realize it's even over
                    $('#row-bot').html('<br> <br>'); 

                    // Change mainLoop mode and button text.
                    actionButton.element.html('New Game');
                    this.mode = 'end';
                } 
                
                // check for death of final opponent
                else if (this.opponent.hp < 1 && ecs.length < 2) {

                    // Update title
                    $('#title').html('Y O U &nbsp;&nbsp; W I N'); 

                    // It's important to add some blank lines above the actionButton to push it down the page
                    // This prevents a user who is mashing 'attack' from restarting the game before they realize it's even over
                    $('#row-bot').html('<br> <br>');

                    // Update mainLoop mode and button text
                    actionButton.element.html('New Game');
                    this.mode = 'end';
                }; 
                
                // Wether or not we've won or lost, we'll still 'kill' the enemy if they died this round
                if (this.opponent.hp < 1) { 

                    // Perform kill actions
                    this.opponent.mkClass('dead'); // Display character as dead
                    ecs.splice(ecs.indexOf(this.opponent),1); // Remove dead character from list of ecs
                    deadNames.push(this.opponent.name); // Add name to list of the dead
                    this.opponent = undefined; // Reset this.opponent

                    // Now ONLY IF we haven't also won or lost the game this round, we'll have the player chose another opponent to fight
                    if (this.mode === 'attack') {

                        // Change mode back to enemy select
                        this.mode = 'enemySelect' 

                        // Reset page back to enemy select:
                        $('#title').html('Select another opponent!');
                        actionButton.element.html('Select');
                    };
                };

                break;
            
            // The end case is triggered when the user clicks the action button after the game has ended. 
            // It's the same for win or loss
            case 'end':

                // Reset global variables and mainLoop attributes used for tracking the game action
                this.mode = 'charSelect';
                pc = undefined;
                ecs = [];
                deadNames = [];
                this.opponent = undefined;

                // Reset characters
                for (c in allChars) {

                    // Resets hp and ap to defaults for all characters
                    allChars[c].reInitialize();

                    // Resets html element positioning 
                    allChars[c].element.detach();
                    $('#row-mid').append(allChars[c].element);

                    // Updates the displayed values for all character stats
                    allChars[c].updateReadout();
                };

                // Set title and button text to defaults
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
    // Every time the actionButton is pressed we want to call the action method on the mainLoop object.
    // Since the action method requires a value argument, we need to call it within an anonymous function
    // from which we can grab the value from the html button element's 'value' property
    actionButton.element.click(
        function () {
            mainLoop.action($(this).val());
        }
    );
};
