import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import { AdminActionConfirmModalComponent } from '../modals/admin-action-confirm-modal/admin-action-confirm-modal.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-manage-forum',
  templateUrl: './manage-forum.component.html',
  styleUrls: ['./manage-forum.component.css']
})
export class ManageForumComponent implements OnInit {
  public loading = true;
  public posts = null;
  public skip = 0;
  public limit = 10;
  public count = 0;
  public page = 1;

  constructor(private route: ActivatedRoute,
              private adminService: AdminService,
              private router: Router,
              private toastr: ToastrService,
              private dialog: MatDialog) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe((p: any) => {
      this.posts = null;
      const page = _.max([_.get(p, 'page', 1), 1]);
      this.skip = (page - 1) * this.limit;
      this.page = page;

      this.loadPosts();
    });
  }

  loadPosts() {
    this.posts = null;
    this.loading = true;
    this.adminService.fetch_forum({limit: this.limit, skip: this.skip}).then((records: any) => {
      this.posts = records.posts;
      this.skip = records.skip;
      this.limit = records.limit;
      this.count = records.count;
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  changePage(event) {
    this.posts = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1 + event.pageIndex
      },
      queryParamsHandling: 'merge', // remove to replace all query params by provided
    });
  }

  delete(id) {
    const modal = this.dialog.open(AdminActionConfirmModalComponent, {data: {message: `Are you sure you want to delete the forum post?.`}});

    modal.afterClosed().subscribe((ok) => {
      if (ok) {
        this.adminService.delete_forum(id).then(() => {
          this.loadPosts();
          this.toastr.success('Forum item deleted successfully', 'Success');
        }).catch(() => {
          this.toastr.error('Request failed. Try again later!', 'Error');
        });
      }
    });
  }

}
