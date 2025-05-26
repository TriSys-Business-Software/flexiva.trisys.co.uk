$(document).ready(function ()
{
    TriSysLoad.ApexFramework.LoadDynamically(function ()
    {
        var d = new Date();
        var iYear = d.getFullYear();
        $('#trisys-upgrading-year').html(iYear);

        do
        {
            if(typeof(TriSysApex) != 'undefined')
            {
                // We are now ready to start our timers
                TriSysApex.Upgrade.Initialise();
                return;
            }
        }
        while(true)
    });
});