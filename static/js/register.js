$(document).ready(function(){
    check_username_url = $("#registerform .js-check-username-url").attr('data-url');
    check_email_url = $("#registerform .js-check-email-url").attr('data-url');
    $("#registerform").validate({
        rules: {
                username: {
                    required: true,
                    remote: {
                        url: check_username_url,
                        type: "get",
                        data: {
                            username: function() {
                                return $("#id_username").val();
                            },
                        },
                    },
                },
                email: {
                    required: true,
                    remote: {
                        url: check_email_url,
                        type: "get",
                        data: {
                            username: function() {
                                return $("#id_email").val();
                            },
                        },
                    },
                },
                password1: {
                    required: true,
                    minlength: 6
                },
                password2: {
                    required: true,
                    minlength: 6,
                    equalTo: "#id_password1"
                },
            },
        submitHandler: function(form) {
            form.submit();
        }
    });
});
