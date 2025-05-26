$(document).ready(function ()
{
    // Initialize tabs
    $('[data-toggle="tabs"] a, .enable-tabs a').click(function (e) { e.preventDefault(); $(this).tab('show'); });

    TriSysApex.Toasters.Error("$(document).ready(function () in ctrlTestModal.html");
});