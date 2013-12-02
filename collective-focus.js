Teams = new Meteor.Collection("teams");
Tasks = new Meteor.Collection("tasks");
Focus = new Meteor.Collection("focus");

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
