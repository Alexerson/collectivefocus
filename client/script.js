// Souscription aux données
Meteor.subscribe("all-teams");
//Meteor.subscribe("team-tasks");
//Meteor.subscribe("team-focus");
//Meteor.subscribe("user-tasks");
Users = Meteor.users;


//CryptoJS.MD5("Alexandre@e-180.com".trim().toLowerCase()).toString(CryptoJS.enc.Hex)


Meteor.Router.add({
    '/': 'home',
    '/team/:id': function(id) {
        Session.set('currentTeamId', id);
        return 'team';
    },
/*    '/user/:id': function(id) {
        Session.set('currentTeamId', id);
        return 'user_detail';
    },*/
    '*': '404'
});

Meteor.Router.beforeRouting = function(route) {
    $("body").removeClass();
    if (route.path == "/") {
        $("body").addClass("home");
    } else {
        $("body").addClass(route.path.substr(1));
    }
}



Template.header.user = function () {
    return Meteor.user();
};

Template.header.first_name = function () { return Meteor.user().profile.first_name; };
Template.header.avatar = function () { return Meteor.user().profile.avatar || "avatar.png"; };

Template.header.events({
    'click a#login' : function () { Meteor.logout(); },
    'click a#logout' : function () { Meteor.logout(); }
});


Template.home.team = function() {
    return Teams.find().fetch(); // synchronous!
}

Template.team_summary.first_members = function() {
    return Users.find({_id: {$in: this.members}}, {limit:3});
}

Template.team_summary.remaining_members_count = function() {
    if (this.members.length > 3) {
        return this.members.length - 3;
    }
    return 0
}



Template.team.helpers({
    id: function() { return Session.get('teamtId'); }
});

Template.team.my_focus = function() {
    if( Meteor.user()) {
        return Focus.findOne({team: this.id, user: Meteor.user()._id});
    }
    return null;
}
