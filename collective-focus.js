Teams = new Meteor.Collection("teams");
Focus = new Meteor.Collection("focus");
Tasks = new Meteor.Collection("tasks");
Users = Meteor.users;

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
