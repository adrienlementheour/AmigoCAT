$(document).ready(function ($) {
  $("#overview-actions").on("click", ".js-overview-actions-send-to-email",
    function (e) {
      e.preventDefault();
      href = $(this).attr("href");
      $.ajax({url: href, success: function(data){$.fancybox(data.html)}});
      $(document).on('submit', '#send-to-email', function(e) {
        e.preventDefault();
        $.ajax({
          url: href,
          data: $(this).serialize(),
          success: function(data){
            if (data.code != 0){
              if (data.errors.emails){
                  alert(data.errors.emails[0]);
              }
            }else{
              $.fancybox.close();
            }
          },
        });
        return false;
      });  
    });
});
