window.onload = function () {

	function restore_options() {
		var option = localStorage.getItem('option');
		if (!option) option = "close";
		document.getElementById("option").value = option;

		var state = localStorage.getItem('state');
		if (!state) state = "maximized";
		document.getElementById("state").value = state;

		var cookies = localStorage.getItem('cookies');
		if (!cookies) cookies = "allow";
		document.getElementById("cookies").value = cookies;
	}

	// save the setting
	document.getElementById("save").onclick = function () {
		var option = document.getElementById("option").value;
		localStorage.setItem('option', option);

		var state = document.getElementById("state").value;
		localStorage.setItem('state', state);

		var cookies = document.getElementById("cookies").value;
		localStorage.setItem('cookies', cookies);

		var status = document.getElementById('status');
		status.textContent = 'Settings saved!';
		setTimeout(function () {
			status.textContent = '';
		}, 750);
	};

	restore_options();
};
