$(document).ready(function(){function e(e){var t=$(this),r=t.data("user-id");$.get(o,{user_id:r}).done(function(e){c.val("").trigger("input"),g.magnificPopup("close"),i.children("tbody").append(e.html),t.parent().hide()}),e.preventDefault()}function t(e){$(this).closest("tr").remove(),e.preventDefault()}function r(e){d.submit(),e.preventDefault()}function n(e){var t,r,n=i.find("tr.file-meta"),a=$(this).val().toLowerCase(),o=new RegExp(a);r=n.filter(function(e,r){return t=$(r).find(".name").text().toLowerCase(),o.test(t)}),n.not(r).hide(),r.show()}function a(){var e,t,r,n,a,o,d,c,g,p,w=u.val(),h=f.val(),v=l.val(),k=i.find("tr.file-meta"),b=$.map(k,function(e,t){return $(e).data("user-id")}),y=m.val().toLowerCase(),x=new RegExp(y);p=s.filter(function(i,s){return e=$(s).find(".nom").text().toLowerCase(),t=x.test(e),r=-1===$.inArray($(s).data("user-id"),b),o=$(s).data("source-langs-ids").toString().split(","),d=$(s).data("target-langs-ids").toString().split(","),n=-1!==$.inArray(w,o),a=-1!==$.inArray(h,d),c=$(s).data("domains-ids").toString().split(","),g=""===v||-1!==$.inArray(v,c),t&&r&&n&&a&&g}),s.not(p).parent().hide(),p.parent().show()}var o="/xhr/projects/get_worker_table_row",i=$("table#file-list"),d=$("#file-list-form"),s=$("#addWorker").find("a.worker"),l=$("#domain"),c=$("#search-added-workers"),u=$("#source-language"),f=$("#target-language"),m=$("#search-available-workers"),g=$(".mfp-wrap");$(document).on("click","#addWorker a.worker",e),$(document).on("click","table#file-list .btn-remove-worker",t),$(document).on("click","#submit-new-workers",r),$(document).on("input","#search-added-workers",n),$(document).on("input","#search-available-workers",a),$(document).on("change","#target-language",a),$(document).on("click","#add-worker",a),$(document).on("change","#domain",a)});