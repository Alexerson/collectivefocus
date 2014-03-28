Teams = new Meteor.Collection("teams");
Focus = new Meteor.Collection("focus");
Tasks = new Meteor.Collection("tasks");
Users = Meteor.users;

var focus_length = 25 * 60; // temps en secondes

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

var generate_color = function() {
    var color = 'hsla(';
    color += Math.round(Math.random() * 360) + ",";
    color += Math.round(Math.random() * 100) + "%,";
    color += Math.round(Math.random() * 100) + "%, 0.6)";

    return color;
}
