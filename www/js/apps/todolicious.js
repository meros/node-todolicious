define(["jquery"],
    function ($) {
        $("todo-app").get(0).model = {
             content: "testing",  
             bullets: [{
                 content: "sub testing1",
                 bullets: []
             }, {
                 content: "sub testing2",
                 bullets: []
             }] };
    });
