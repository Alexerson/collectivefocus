Meteor.startup(function () {
    // code to run on server at startup

    // server: populate collections with some initial documents
    Teams.remove({});
    if (Teams.find({}).count() === 0) {
        Teams.insert({name: "Cool '80", members:[]});
    }
});

Meteor.publish("all-teams", function () {
    return Teams.find(); // everything
});

Meteor.publish("team-focus", function (teamId) {
    return Focus.find({team: teamId}); // everything
});

Meteor.publish("team-tasks", function (teamId) {
  return Tasks.find({team: teamId});
});

Meteor.publish("user-tasks", function (userId) {
  return Tasks.find({user: userId});
});
