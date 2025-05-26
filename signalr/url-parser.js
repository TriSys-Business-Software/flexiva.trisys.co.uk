var URL =
{
    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
    // Example usage:
    // var sURL = window.location.href;     e.g. http://stuff.html?param1=value1
    // alert('param=' + TriSysApex.URL.Parser(sURL).getParam("param1") );
    //
    Parser: function (u)    // TriSysApex.URL.Parser
    {
        var path = "", query = "", hash = "", params;
        if (u.indexOf("#") > 0)
        {
            hash = u.substr(u.indexOf("#") + 1);
            u = u.substr(0, u.indexOf("#"));
        }
        if (u.indexOf("?") > 0)
        {
            path = u.substr(0, u.indexOf("?"));
            query = u.substr(u.indexOf("?") + 1);
            params = query.split('&');
        } else
            path = u;
        return {
            getHost: function ()
            {
                var hostexp = /\/\/([\w.-]*)/;
                var match = hostexp.exec(path);
                if (match != null && match.length > 1)
                    return match[1];
                return "";
            },
            getPath: function ()
            {
                var pathexp = /\/\/[\w.-]*(?:\/([^?]*))/;
                var match = pathexp.exec(path);
                if (match != null && match.length > 1)
                    return match[1];
                return "";
            },
            getHash: function ()
            {
                return hash;
            },
            getParams: function ()
            {
				return params;
            },
            getQuery: function ()
            {
                return query;
            },
            setHash: function (value)
            {
                if (query.length > 0)
                    query = "?" + query;
                if (value.length > 0)
                    query = query + "#" + value;
                return path + query;
            },
            setParam: function (name, value)
            {
                if (!params)
                {
                    params = new Array();
                }
                params.push(name + '=' + value);
                for (var i = 0; i < params.length; i++)
                {
                    if (query.length > 0)
                        query += "&";
                    query += params[i];
                }
                if (query.length > 0)
                    query = "?" + query;
                if (hash.length > 0)
                    query = query + "#" + hash;
                return path + query;
            },
            getParam: function (name)       //TriSysApex.URL.Parser.getParam
            {
                if (params)
                {
                    for (var i = 0; i < params.length; i++)
                    {
                        var pair = params[i].split('=');
                        if (decodeURIComponent(pair[0]) == name)
                            return decodeURIComponent(pair[1]);
                    }
                }
                console.log('Query variable %s not found', name);
            },
            hasParam: function (name)
            {
                if (params)
                {
                    for (var i = 0; i < params.length; i++)
                    {
                        var pair = params[i].split('=');
                        if (decodeURIComponent(pair[0]) == name)
                            return true;
                    }
                }
                console.log('Query variable %s not found', name);
            },
            removeParam: function (name)
            {
                query = "";
                if (params)
                {
                    var newparams = new Array();
                    for (var i = 0; i < params.length; i++)
                    {
                        var pair = params[i].split('=');
                        if (decodeURIComponent(pair[0]) != name)
                            newparams.push(params[i]);
                    }
                    params = newparams;
                    for (var i = 0; i < params.length; i++)
                    {
                        if (query.length > 0)
                            query += "&";
                        query += params[i];
                    }
                }
                if (query.length > 0)
                    query = "?" + query;
                if (hash.length > 0)
                    query = query + "#" + hash;
                return path + query;
            }
        }
    }                       // End of TriSysApex.URL.Parser
};   