var AppRouter = Backbone.Router.extend({

    routes: {
        ""                      : "home",
        "templates"	            : "list",
        "templates/page/:page"	: "list",
        "templates/add"         : "addTemplate",
        "templates/:id"         : "templateDetails",
        "templates/:users"      : "list",
        "about"                 : "about"
    },

    initialize: function () {
        this.headerView = new HeaderView();
        $('.header').html(this.headerView.el);
    },

    home: function (id) {
        if (!this.homeView) {
            this.homeView = new HomeView();
        }
        $('#content').html(this.homeView.el);
        this.headerView.selectMenuItem('home-menu');
    },

	list: function(page) {
        var p = page ? parseInt(page, 10) : 1;
        var templateList = new TemplateCollection();
        templateList.fetch({success: function(){
            $("#content").html(new TemplateListView({model: templateList, page: p}).el);
        }});
        this.headerView.selectMenuItem('home-menu');
    },

    templateDetails: function (id) {
        var template = new Template({_id: id});
        template.fetch({success: function(){
            $("#content").html(new TemplateView({model: template}).el);
        }});
        this.headerView.selectMenuItem();
    },

	addTemplate: function() {
        var template = new Template();
        $('#content').html(new TemplateView({model: template}).el);
        this.headerView.selectMenuItem('add-menu');
	},

    about: function () {
        if (!this.aboutView) {
            this.aboutView = new AboutView();
        }
        $('#content').html(this.aboutView.el);
        this.headerView.selectMenuItem('about-menu');
    }

});

utils.loadTemplate(['HomeView', 'HeaderView', 'AboutView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});