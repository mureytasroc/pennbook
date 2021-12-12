
<template>
	<q-form @submit="submitForm(formData)">

        <q-input v-if="tab=='register'"
			v-model="formData.firstName"
			class="q-mb-md"
			outlined
			label="First Name"
			lazy-rules
		/>

        <q-input v-if="tab=='register'"
			v-model="formData.lastName"
			class="q-mb-md"
			outlined
			label="Last Name"
			lazy-rules
		/>

		<q-input v-if="tab=='register'"
			v-model="formData.emailAddress"
			class="q-mb-md"
			outlined
			type="email"
			standout
			label="Email"
			lazy-rules
		>
		<template v-slot:prepend>
          <q-icon name="mail" />
        </template>
		</q-input>

         <q-select outlined v-if="tab=='register'" v-model="formData.affiliation" :options="options" label="Affiliation" />
        <br>
         <q-input v-if="tab=='register'"
			v-model="formData.birthay"
			class="q-mb-md"
			outlined
            type="date"
			hint="Birthday"
			lazy-rules
		>
		</q-input>

        <br>

        <q-input
			v-model="formData.username"
			class="q-mb-md"
			outlined
			label="Username"
			lazy-rules
		/>

		<q-input
			v-model="formData.password"
			class="q-mb-md"
			outlined
			type="password"
			label="Password"
			:rules="[ val => (val.length >= 8 && val.toLowerCase() != 'password')  ||  'Please enter at least 8 characters!']"
			lazy-rules
		>
		</q-input>

		<q-input v-if="tab=='register'"
			v-model="confirmPassword"
			class="q-mb-md"
			outlined
			type="password"
			label="Confirm Password"
			:rules="[ val => (val == formData.password)  ||  'You passwords do not match!']"
			lazy-rules
		/>

		<div class="row">

			<q-btn
				v-if="tab=='register'"
				color="primary"
				icon="help"
				@click="alert=true"
			/>

			<q-space />
			<q-btn
				class="authButton"
				color="primary"
				type="submit"
				:label="tab"
                @click="test"
			>
				<q-popup-proxy>
					<q-banner>
						{{this.message}}
					</q-banner>
				</q-popup-proxy>
			</q-btn>
		</div>
	</q-form>
</template>

<script>
	import { mapActions } from "vuex";
    import axios from 'axios';

	export default {
		props: ["tab"],

		data() {
			return {
				formData: {
					emailAddress: "",
                    username: "",
					password: "",
                    firstName: "",
                    lastName: "",
                    affiliation: "",
                    interests: [],
				},
                options: ['Google', 'Facebook', 'Twitter', 'Apple', 'Oracle'],
                confirmPassword: "",
				message: "Please fill out the form entirely!",
				alert: false,

			};
		},

		methods: {

			async submitForm(formData) {
				if (this.tab === "login") {
					// login tab
					this.message = "Logging in...";
					await this.loginUser(this.formData);

					if (firebaseAuth.currentUser) {
						if (firebaseAuth.currentUser.emailVerified) {
							this.message = "Logging in..."; // will this hide the message?
						} else {
							this.message = "Please verify your email.";
						}
					} else {
						this.message =
							"Please retype your credentials or register your account.";
					}
				} else {
					// registration tab

					/*axios.post('/api/users', {
                        formData,
                    }).then(function (resp) => {
                        if (resp.status == 201) {
                            // created

                        } else if (resp.status == 400) {
                            // bad req


                        } else if (resp.status == 409) {
                            // user taken
                        }

                    });*/

				}
			},
		},
	};
</script>
