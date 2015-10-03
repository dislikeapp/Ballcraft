<?php
$action = $_GET["action"];
if ($action == "start") {
	pclose(popen("start node main.js", "r"));
	echo '<script>document.location = "'.$_SERVER["PHP_SELF"].'";</script>';
}
else if ($action == "stop") {
	shell_exec("start taskkill /f /im node.exe");
	echo '<script>document.location = "'.$_SERVER["PHP_SELF"].'";</script>';
}
else if ($action == NULL)
{ ?>
<html>
	<head>
		<meta charset="utf-8">
		<link rel="stylesheet" href="style.css" />
	</head>
	<body>
		<span class="block" id="loading">
			Loading...
		</span>
		<span class="block" id="output" style="display: none; width: 400px;">
			<div id="serverStatus">
				<table width="100%">
					<tr><th>Server Status</th></tr>
					<tr><td><center><span id="status">Unknown</span></center></td></tr>
					<tr><td><input id="switch" type="button" value="Do nothing." /></td></tr>
				</table>
			</div>
			<div id="serverInfo" style="display: none;">
				<br />
				<table width="100%">
					<tr><th colspan="2">Server Info</th></tr>
					<tr><td>Name</td><td><span id="serverName"></span></td></tr>
					<tr><td>Players</td><td><span id="serverPlayers"></span></td></tr>
				</table>
			</div>
		</span>
		<span class="block" id="output" style="width: 400px;">
			<table width="100%">
				<tr><th>Exec</th></tr>
				<tr><td>function() {<br />
					<textarea id="execCode" style="width: 100%; height: 200px;"></textarea><br />
				};</td></tr>
				<tr><td><input type="button" value="Submit" onclick="submitExec();" /></td></tr>
				<tr><td><div id="execResult" style="white-space: pre;"></div></td></tr>
			</table>
		</span>
		<script>
			var socket = undefined;
			var rooms = {};
			var agents = {};
			var server = {
				"name"		: "Undefined",
				"numUsers"	: 0,
				"maxUsers"	: 0
			};
			
			function stopServer() {
				document.location = "?action=stop";
			}
			function startServer() {
				document.location = "?action=start";
			}
			
			function submitExec() {
				var code = document.getElementById("execCode").value;
				socket.emit("exec", {
					requestID: 0,
					code: code
				});
			}
			
			function connect() {
				socket = io.connect("http://omniserver.no-ip.biz", {port: 8080});
				
				var updateServerInfo = function() {
					var serverInfo = document.getElementById("serverInfo");
					var serverName = document.getElementById("serverName");
					var serverPlayers = document.getElementById("serverPlayers");
					
					serverName.innerHTML = server.name;
					serverPlayers.innerHTML = server.numUsers + ' / ' + server.maxUsers;
				};
				var updateOutput = function() {
					updateServerInfo();
				};
				var getInfo = function() {
					socket.emit("getServerInfo");
				};
				
				updateOutput();
				
				socket.on("connect", function () {
					getInfo();
					setTimeout(getInfo, 2000);
					
					socket.on("serverInfo", function(serverInfo) {
						server.name = serverInfo.name;
						server.numUsers = serverInfo.numUsers;
						server.maxUsers = serverInfo.maxUsers;
						updateOutput();
					});
					socket.on("execResult", function(result) {
						var data = result.data;
						if (typeof data == "object")
							data = JSON.stringify(data, null, '\t');
						var str = 'Request ID: '+result.requestID+'\n\n'+data+'\n';
						document.getElementById("execResult").innerHTML = str;
						console.log(result);
					});
				});
			}
			function disconnect() {
				if (socket != undefined) {
					socket.disconnect();
					socket = undefined;
				}
			}
			
			function setStatus(status) {
				var text = document.getElementById("status");
				text.innerHTML = status ?
					'<font color="green" size="8">Online</font>' :
					'<font color="red" size="8">Offline</font>';
				
				var btn = document.getElementById("switch");
				btn.value = status ? "Stop" : "Start";
				
				btn.onclick = status ? stopServer : startServer;
				
				if (status) connect();
				else disconnect();
			}
			
			function tryConnect(success, failure, both) {
				try {
					var timeout = setTimeout(function() {
						script.parentNode.removeChild(script);
						failure();
						both();
					}, 5000);
					
					var script = document.createElement("script");
					script.setAttribute("src", "http://omniserver.no-ip.biz:8080/socket.io/socket.io.js");
					document.head.appendChild(script);
					var finished = false;
					
					script.onreadystatechange = function () {
						if (this.readyState == "complete" || this.readyState == "loaded") {
							if (!finished) {
								finished = true;
								clearTimeout(timeout);
								if (io != undefined)
									success();
								else
									failure();
								both();
							}
						}
					}
					script.onload = function () {
						clearTimeout(timeout);
						if (io != undefined)
							success();
						else
							failure();
						both();
					}
				} catch (e) {alert(e.message);
					failure();
					both();
					return;
				}
				
			}
			//document.addEventListener("load", function() {
				tryConnect(
					function() {
						document.getElementById("serverInfo").style.display = "block";
						setStatus(true);
					},
					function() {
						document.getElementById("serverInfo").style.display = "none";
						setStatus(false);
					},
					function() {
						document.getElementById("loading").style.display = "none";
						document.getElementById("output").style.display = "inline-block";
					});
			//});
		</script>
	</body>
</html>
<?php } ?>
