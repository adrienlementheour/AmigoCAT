$(function () {
  var $modal = $('#dialog-modal.js-show');
  $modal.dialog({
    minHeight: 'auto',
    minWidth: 'auto',
    modal: true,
    draggable: false,
    resizable: false,
    show: true
  });
  $('#dialog-modal').on('submit', 'form', function(e){
    e.preventDefault();
    $.post($(this).attr('action'), $(this).serializeArray(), function(data){
      if (data.success) {
        $modal.dialog( "destroy" );
      } else {
        $modal.html(data.html);
      }
    }, 'json');
  });
});